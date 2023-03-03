import { Store, Event } from 'effector';

export interface IPersistLFProps<TRecord> {
  key: string;
  record: Store<TRecord>;
  clock?: Event<Partial<TRecord>>;
}
