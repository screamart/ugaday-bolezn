// localStorage can be missing or throw (private mode, blocked storage): the game must work without it.
import {STORAGE_KEY, STORAGE_SCHEMA} from './config.js';

export function load(){
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!data || typeof data !== 'object') return {};
    // A different schema keeps settings, played cards and the record, but drops the game in progress.
    if (data.schema !== STORAGE_SCHEMA) return {settings: data.settings, played: data.played, record: data.record};
    return data;
  } catch {
    return {};
  }
}

export function save(data){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({schema: STORAGE_SCHEMA, ...data}));
  } catch {
    // Storage is full or blocked: the game goes on, it just will not survive a reload.
  }
}
