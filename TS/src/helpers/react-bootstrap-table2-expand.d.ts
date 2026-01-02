declare module 'react-bootstrap-table2-expand' {
  import { ComponentType } from 'react';
  interface ExpandRowProps<R = any, K = unknown> {
    renderer: (row: R, rowIndex: number) => React.ReactNode;
    showExpandColumn?: boolean;
    expandByColumnOnly?: boolean;
    expandColumnPosition?: 'left' | 'right';
    expanded?: K[];
    onlyOneExpanding?: boolean;
    nonExpandable?: K[];
    onExpand?: (row: R, isExpand: boolean, rowIndex: number, e: React.MouseEvent) => void;
    onExpandAll?: (isAllExpanded: boolean, rowKeys: K[], e: React.MouseEvent) => void;
    className?: string;
    parentClassName?: string;
    expandColumnRenderer?: () => React.ReactNode;
    expandHeaderColumnRenderer?: () => React.ReactNode;
  }
  const expandFactory: ComponentType<ExpandRowProps>;
  export default expandFactory;
}
