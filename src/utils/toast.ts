import toast from "react-hot-toast";

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const successToast = (scope: string, message: string): void => {
  toast.success(message, { id: `${normalize(scope)}-success-${normalize(message)}` });
};

export const errorToast = (scope: string, message: string): void => {
  toast.error(message, { id: `${normalize(scope)}-error-${normalize(message)}` });
};
