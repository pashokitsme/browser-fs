import { FileProvider, Uri } from './internal/FileProvider';
import Path from './internal/Path';

export class BrowserFileProvider implements FileProvider {
	private _storage?: FileSystemDirectoryHandle;

	constructor() {
		if (!(window && window.File && window.FileReader && window.FileList && window.Blob))
			throw new Error('FileSystemAPI not supported');
	}

	getStorageId(): string {
		const user = document.cookie.split('user=')[1].split('%')[0];
		return `Browser@${user}`;
	}

	async getItems(path: Path): Promise<Uri[]> {
		const directory = await this.directory(path);
		const items: Uri[] = [];
		if (!directory) return items;
		for await (const [name, handle] of directory.entries()) {
			items.push({
				isFolder: handle.kind === 'directory',
				name,
				path: path.join(new Path(name)),
			});
		}

		return items;
	}

	async exists(path: Path): Promise<boolean> {
		return !!(await this.directory(path)) || !!(await this.file(path));
	}

	delete: (path: Path) => void;

	deleteEmptyFolders: (path: Path) => void;

	async write(path: Path, data: string | Buffer) {
		console.info(`Writing file ${path}`);
		this.stopWatch();
		const filename = path.nameWithExtension;
		const directory = await this.directory(path.rootDirectory, true);
		const file = await directory.getFileHandle(filename, { create: true });
		const stream = await file.createWritable({ keepExistingData: false });

		await stream.write(data);
		await stream.close();
		this.startWatch();
	}

	read: (path: Path) => string;

	readAsBinary: (path: Path) => Buffer;

	move: (oldFilePath: Path, newFilePath: Path) => void;

	startWatch() {}

	stopWatch() {}

	private async directory(
		path: Path,
		create?: boolean,
	): Promise<FileSystemDirectoryHandle | undefined> {
		return path.value == ''
			? this.storage()
			: path.value.split('/').reduce(async (prev, path) => {
					return (prev = prev.then((x) =>
						x.getDirectoryHandle(path, { create }).catch(() => undefined),
					)).catch(() => undefined);
			  }, this.storage());
	}

	private async file(path: Path, create?: boolean): Promise<FileSystemFileHandle | undefined> {
		const root = path.rootDirectory.value == path.value ? new Path('') : path.rootDirectory;
		const directory = await this.directory(root).catch(() => undefined);
		return directory
			? directory.getFileHandle(path.nameWithExtension, { create }).catch(() => undefined)
			: undefined;
	}

	private async storage() {
		if (!this._storage) this._storage = await navigator.storage.getDirectory();
		return this._storage;
	}
}
