import * as React from 'react';
import {
  Modal,
  IconButton,
  SearchBox,
  Stack,
  IStackTokens,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  DefaultButton
} from '@fluentui/react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';

export interface ISearchModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  spfxContext: WebPartContext;
  complaintsListId?: string;
}

interface ComplaintItem {
  Id: number;
  Title: string;
  STATUS_?: string;
  [key: string]: any;
}

const stackTokens: IStackTokens = { childrenGap: 20 };

export const SearchModal: React.FC<ISearchModalProps> = (props) => {
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<ComplaintItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [totalResults, setTotalResults] = React.useState<number>(0);
  const [hasMoreResults, setHasMoreResults] = React.useState<boolean>(false);
  
  const ITEMS_PER_PAGE = 20;

  const performSearch = async (query: string, page: number = 1): Promise<void> => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setError(null);
      setTotalResults(0);
      setHasMoreResults(false);
      return;
    }

    if (!props.complaintsListId) {
      setError('Complaints List ID is not configured. Please configure the web part properties.');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const sp: SPFI = spfi().using(SPFx(props.spfxContext));
      const list = sp.web.lists.getById(props.complaintsListId);

      // Get all fields to find internal names for our target columns
      const allFields = await list.fields
        .filter("Hidden eq false")
        .select("InternalName", "Title")();

      console.log('Available fields:', allFields);

      // Map display names to internal names
      const fieldMap = new Map(allFields.map(f => [f.Title, f.InternalName]));
      
      const targetColumns = ['ID_val', 'Title', 'COMPLAINANT NAME', 'BORROWER NAME', 'STATUS_', 'AssignedToText', 'LOAN ID', 'NIF'];
      const searchableFields: string[] = [];
      
      targetColumns.forEach(columnName => {
        const internalName = fieldMap.get(columnName);
        if (internalName) {
          searchableFields.push(internalName);
        }
      });

      console.log('Searchable fields (internal names):', searchableFields);

      // Build search filter
      const searchTerm = query.trim();
      const filterParts = searchableFields.map(field => 
        `substringof('${searchTerm}', ${field})`
      );
      const filterQuery = `(${filterParts.join(' or ')})`;

      console.log('Search filter query:', filterQuery);

      // Build select query with all searchable fields plus additional display fields
      // Always include Title, Id, and other standard fields
      const selectFields = ['Title', 'Id', 'STATUS_', 'DESCRIPTION', 'Answer_x0020_Limit_x0020_date', 'Created', ...searchableFields];
      const uniqueSelectFields = Array.from(new Set(selectFields));

      console.log('Selecting fields:', uniqueSelectFields);

      // Fetch ALL matching items to sort properly
      let allMatchingItems: any[] = [];
      
      if (page === 1) {
        // On first search, fetch all matching items
        let pagedResults = await list.items
          .filter(filterQuery)
          .top(5000)
          .select(...uniqueSelectFields)
          .getPaged();
        
        allMatchingItems = [...pagedResults.results];
        
        // Continue fetching pages until no more results
        while (pagedResults.hasNext) {
          const nextPage = await pagedResults.getNext();
          if (nextPage) {
            allMatchingItems = [...allMatchingItems, ...nextPage.results];
            pagedResults = nextPage;
          } else {
            break;
          }
        }
        
        // Sort all items by ID descending (highest to lowest)
        allMatchingItems.sort((a, b) => b.Id - a.Id);
        
        // Store in session storage for pagination
        sessionStorage.setItem('searchResults_' + query, JSON.stringify(allMatchingItems));
        
        setTotalResults(allMatchingItems.length);
        console.log('Total matching results:', allMatchingItems.length);
      } else {
        // For subsequent pages, retrieve from session storage
        const cached = sessionStorage.getItem('searchResults_' + query);
        if (cached) {
          allMatchingItems = JSON.parse(cached);
        }
      }

      // Calculate pagination from the sorted results
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const displayItems = allMatchingItems.slice(startIndex, endIndex);
      const hasMore = endIndex < allMatchingItems.length;

      console.log('Displaying items:', displayItems);
      
      setSearchResults(displayItems);
      setHasMoreResults(hasMore);
      setCurrentPage(page);
    } catch (err) {
      console.error('Search error:', err);
      setError(`Error searching: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (newValue?: string): void => {
    setSearchQuery(newValue || '');
  };

  const handleSearchSubmit = (): void => {
    setCurrentPage(1);
    performSearch(searchQuery, 1);
  };

  const handleClear = (): void => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setCurrentPage(1);
    setTotalResults(0);
    setHasMoreResults(false);
    // Clear session storage
    if (searchQuery) {
      sessionStorage.removeItem('searchResults_' + searchQuery);
    }
  };

  const handleNextPage = (): void => {
    const nextPage = currentPage + 1;
    performSearch(searchQuery, nextPage);
  };

  const handlePreviousPage = (): void => {
    const prevPage = Math.max(1, currentPage - 1);
    performSearch(searchQuery, prevPage);
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onDismiss={props.onDismiss}
      isBlocking={false}
      containerClassName="searchModalContainer"
      styles={{
        main: {
          width: '80vw',
          height: '80vh',
          maxWidth: '80vw',
          maxHeight: '80vh',
          borderRadius: '8px',
          padding: '20px'
        },
        scrollableContent: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Stack tokens={stackTokens} styles={{ root: { height: '100%' } }}>
        {/* Header with close button */}
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            Search Complaints
          </h2>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            ariaLabel="Close"
            onClick={props.onDismiss}
            styles={{
              root: {
                color: '#605e5c',
                marginRight: '-10px'
              },
              rootHovered: {
                color: '#323130',
                backgroundColor: '#f3f2f1'
              }
            }}
          />
        </Stack>

        {/* Search Bar */}
        <Stack tokens={{ childrenGap: 10 }}>
          <SearchBox
            placeholder="Search by ID, Title, Complainant, Borrower, Status, Assigned To, Loan ID, or NIF..."
            value={searchQuery}
            onChange={(_, newValue) => handleSearch(newValue)}
            onClear={handleClear}
            onSearch={handleSearchSubmit}
            disabled={isSearching}
            styles={{
              root: {
                width: '100%',
                fontSize: '16px'
              }
            }}
          />
          {searchQuery && !isSearching && (
            <div style={{ color: '#605e5c', fontSize: '14px' }}>
              {searchResults.length > 0 ? (
                <>Found <strong>{totalResults}</strong> total result(s) - Showing page {currentPage}</>
              ) : (
                searchResults.length === 0 && !error ? (
                  <>No results found for: <strong>{searchQuery}</strong></>
                ) : null
              )}
            </div>
          )}
        </Stack>

        {/* Error Message */}
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

        {/* Loading Spinner */}
        {isSearching && (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 10 }}>
            <Spinner size={SpinnerSize.large} label="Searching complaints..." />
          </Stack>
        )}

        {/* Search Results */}
        <Stack
          styles={{
            root: {
              flex: 1,
              backgroundColor: '#faf9f8',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid #e1dfdd',
              overflowY: 'auto'
            }
          }}
        >
          {!isSearching && searchResults.length === 0 && !searchQuery && (
            <div style={{ textAlign: 'center', color: '#605e5c', marginTop: '40px' }}>
              <p>Enter a search term to find complaints</p>
            </div>
          )}

          {!isSearching && searchResults.length === 0 && searchQuery && !error && (
            <div style={{ textAlign: 'center', color: '#605e5c', marginTop: '40px' }}>
              <p>No complaints found matching your search</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <>
              <Stack tokens={{ childrenGap: 15 }}>
                {searchResults.map((item) => (
                  <div
                    key={item.Id}
                    style={{
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #d1d1d1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Stack tokens={{ childrenGap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#323130' }}>
                          {item.Title || 'Untitled'}
                        </h3>
                        <span
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#f3f2f1',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#605e5c'
                          }}
                        >
                          ID: {item.Id}
                        </span>
                      </div>
                      {item.STATUS_ && (
                        <div style={{ fontSize: '14px' }}>
                          <strong>Status:</strong> <span style={{ color: '#0078d4' }}>{item.STATUS_}</span>
                        </div>
                      )}
                      {item.DESCRIPTION && (
                        <div style={{ fontSize: '14px', color: '#605e5c', marginTop: '8px' }}>
                          {item.DESCRIPTION.length > 150
                            ? `${item.DESCRIPTION.substring(0, 150)}...`
                            : item.DESCRIPTION}
                        </div>
                      )}
                      {item.Answer_x0020_Limit_x0020_date && (
                        <div style={{ fontSize: '12px', color: '#a19f9d', marginTop: '8px' }}>
                          <strong>Answer Limit:</strong>{' '}
                          {new Date(item.Answer_x0020_Limit_x0020_date).toLocaleDateString()}
                        </div>
                      )}
                    </Stack>
                  </div>
                ))}
              </Stack>

              {/* Pagination Controls */}
              <Stack
                horizontal
                horizontalAlign="space-between"
                verticalAlign="center"
                styles={{
                  root: {
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #d1d1d1'
                  }
                }}
              >
                <div style={{ fontSize: '14px', color: '#605e5c' }}>
                  Page {currentPage} - Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {(currentPage - 1) * ITEMS_PER_PAGE + searchResults.length} results{hasMoreResults ? '+' : ''}
                </div>
                <Stack horizontal tokens={{ childrenGap: 10 }}>
                  <DefaultButton
                    text="Previous"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    iconProps={{ iconName: 'ChevronLeft' }}
                  />
                  <PrimaryButton
                    text="Next"
                    onClick={handleNextPage}
                    disabled={!hasMoreResults}
                    iconProps={{ iconName: 'ChevronRight' }}
                  />
                </Stack>
              </Stack>
            </>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
};
