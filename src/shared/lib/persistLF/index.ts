import { createEffect, createEvent, forward, sample } from 'effector';
import localforage from 'localforage';
import { IPersistLFProps } from './types';

export const persistLF = <TRecord extends unknown>({
  key,
  record,
  clock = null,
}: IPersistLFProps<TRecord>): void => {
  const initForm = createEvent();

  const initFormFx = createEffect<unknown, TRecord>(
    async () => await localforage.getItem(key),
  );

  const changeFormFx = createEffect<TRecord, void>((data) => {
    localforage.setItem(key, data);
  });

  sample({
    clock: record,
    filter: Boolean,
    target: changeFormFx,
  });

  if (clock)
    sample({
      clock: initFormFx.doneData,
      filter: Boolean,
      target: clock,
    });
  else
    sample({
      clock: initFormFx.doneData,
      filter: Boolean,
      target: record,
    });

  forward({
    from: initForm,
    to: initFormFx,
  });

  initForm();
};
