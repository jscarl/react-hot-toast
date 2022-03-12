import {
  Renderable,
  Toast,
  ToastOptions,
  ToastType,
  DefaultToastOptions,
  ValueOrFunction,
  resolveValue,
} from './types';
import { genId } from './utils';
import { dispatch, ActionType } from './store';

type Message = ValueOrFunction<Renderable, Toast>;

type Description = ValueOrFunction<Renderable, Toast>;

type ToastHandler = (message: Message, description?: Description, options?: ToastOptions) => string;

const createToast = (
  message: Message,
  type: ToastType = 'blank',
  description?: Description,
  opts?: ToastOptions
): Toast => ({
  createdAt: Date.now(),
  visible: true,
  type,
  ariaProps: {
    role: 'status',
    'aria-live': 'polite',
  },
  message,
  description,
  pauseDuration: 0,
  ...opts,
  id: opts?.id || genId(),
});

const createHandler = (type?: ToastType): ToastHandler => (
  message,
  description,
  options
) => {
  const toast = createToast(message, type, description, options);
  dispatch({ type: ActionType.UPSERT_TOAST, toast });
  return toast.id;
};

const toast = (message: Message, description?: Description, opts?: ToastOptions) =>
  createHandler('blank')(message, description, opts);

toast.error = createHandler('error');
toast.success = createHandler('success');
toast.loading = createHandler('loading');
toast.custom = createHandler('custom');
toast.warn = createHandler('warn');

toast.dismiss = (toastId?: string) => {
  dispatch({
    type: ActionType.DISMISS_TOAST,
    toastId,
  });
};

toast.remove = (toastId?: string) =>
  dispatch({ type: ActionType.REMOVE_TOAST, toastId });

toast.promise = <T>(
  promise: Promise<T>,
  msgs: {
    loading: Renderable;
    success: ValueOrFunction<Renderable, T>;
    error: ValueOrFunction<Renderable, any>;
  },
  opts?: DefaultToastOptions
) => {
  const id = toast.loading(msgs.loading, null,{ ...opts, ...opts?.loading });

  promise
    .then((p) => {
      toast.success(resolveValue(msgs.success, p), null, {
        id,
        ...opts,
        ...opts?.success,
      });
      return p;
    })
    .catch((e) => {
      toast.error(resolveValue(msgs.error, e), null, {
        id,
        ...opts,
        ...opts?.error,
      });
    });

  return promise;
};

export { toast };
