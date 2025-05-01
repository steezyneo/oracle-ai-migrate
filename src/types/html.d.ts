
// Custom type declarations for HTML elements
declare namespace JSX {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    // Add support for the directory selection attributes
    webkitdirectory?: string;
    directory?: string;
  }
}
