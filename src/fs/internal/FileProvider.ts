// import { ChangeItem } from '../Watchers/model/ChangeItem';
// import Watcher from '../Watchers/model/Watcher';
import Path from './Path';

export interface FileProvider {
	getStorageId: () => string;
	getItems: (path: Path) => Promise<Uri[]>;
	exists: (path: Path) => Promise<boolean>;
	delete: (path: Path) => void;
	// getStat: (path: Path) => Stats;
	deleteEmptyFolders: (path: Path) => void;
	write: (path: Path, data: string | Buffer) => void;
	read: (path: Path) => Promise<string>;
	readAsBinary: (path: Path) => Promise<Buffer>;
	// getItemRef: (path: Path) => ItemRef;
	move: (oldFilePath: Path, newFilePath: Path) => void;

	// initWatcher: (watcher: Watcher) => void;
	// watch: (onChange: (changeItems: ChangeItem[]) => void) => void;
	// startWatch: () => void;
	// stopWatch: () => void;
}

export interface Uri {
	isFolder: boolean;
	name: string;
	path: Path;
}
