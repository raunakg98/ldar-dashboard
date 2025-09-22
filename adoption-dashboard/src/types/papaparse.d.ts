declare module 'papaparse' {
  export type ParseResult<T> = {
    data: T[];
    errors: Array<{ type: string; code: string; message: string; row?: number }>;
    meta: unknown;
  };
  const Papa: {
    parse: (input: any, config: any) => void;
  };
  export default Papa;
}