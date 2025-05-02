
// Custom type declarations for HTML elements
declare namespace JSX {
  interface IntrinsicElements {
    // Extend input element with directory selection attributes
    input: React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement> & {
        webkitdirectory?: string;
        directory?: string;
      },
      HTMLInputElement
    >;
  }
}
