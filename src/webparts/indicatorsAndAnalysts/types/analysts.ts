export interface AnalystData {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  initials?: string;
}

export interface AnalystsData {
  analysts: AnalystData[];
  loading: boolean;
  error: string | null;
}

export interface UseAnalystsDataProps {
  listId?: string;
  analystsListId?: string;
  spfxContext: any;
}

export interface AnalystCardProps {
  analyst: AnalystData;
  className?: string;
  showDetails?: boolean;
  onClick?: (analyst: AnalystData) => void;
}

export interface AnalystsSectionProps {
  analysts: AnalystData[];
  loading: boolean;
  error: string | null;
  title?: string;
  className?: string;
  showTitle?: boolean;
}
