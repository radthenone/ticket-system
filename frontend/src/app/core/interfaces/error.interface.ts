export interface FieldError {
    value: boolean;
    message: string;
    errorType: string;
  }

  export interface DjangoError {
    non_field_errors?: string[];
    [key: string]: string[] | any;
  }