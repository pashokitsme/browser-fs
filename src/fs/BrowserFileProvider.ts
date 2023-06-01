import { FileProvider, Uri } from './internal/FileProvider';
import Path from './internal/Path';

export class BrowserFileProvider implements FileProvider {
	private _storage?: FileSystemDirectoryHandle;

	constructor() {
		if (!(window && window.File && window.FileReader && window.FileList && window.Blob))
			throw new Error('FileSystemAPI not supported');
	}

	getStorageId(): string {
		const user = (document.cookie.split('user=')[1] ?? 'unknown').split('%')[0];
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

	async delete(path: Path) {
		const name = path.nameWithExtension;
		const directory = await this.directory(path, { useRoot: true });
		await directory
			.removeEntry(name, { recursive: true })
			.catch(() => console.warn(`Entry ${path} not found`));
	}

	async deleteEmptyFolders(path: Path) {
		const directory = await this.directory(path);
		if (!directory) return;
		for await (const [path, handle] of directory.entries()) {
			if (handle.kind === 'file') continue;
			const inner = await directory.getDirectoryHandle(path);
			if (await this.isEmpty(inner)) {
				console.log(inner);
				await directory.removeEntry(handle.name);
				console.info(`Deleting empty: ${path}`);
			}
		}
	}

	async write(path: Path, data: string | Buffer) {
		console.info(`Writing file ${path}`);
		this.stopWatch();
		const filename = path.nameWithExtension;
		const directory = await this.directory(path.rootDirectory, { useRoot: false, create: true });
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

	private async isEmpty(directory: FileSystemDirectoryHandle) {
		for await (const _ of directory.entries()) return false;
		return true;
	}

	private async directory(
		path: Path,
		{ useRoot, create }: { useRoot?: boolean; create?: boolean } = {},
	): Promise<FileSystemDirectoryHandle | undefined> {
		const _path = useRoot
			? path.rootDirectory.value == path.value
				? new Path('')
				: path.rootDirectory
			: path;

		return _path.value == ''
			? this.storage()
			: _path.value.split('/').reduce(async (prev, path) => {
					return (prev = prev.then((x) =>
						x.getDirectoryHandle(path, { create }).catch(() => undefined),
					)).catch(() => undefined);
			  }, this.storage());
	}

	private async file(path: Path, create?: boolean): Promise<FileSystemFileHandle | undefined> {
		const directory = await this.directory(path, { useRoot: true }).catch(() => undefined);
		return directory
			? directory.getFileHandle(path.nameWithExtension, { create }).catch(() => undefined)
			: undefined;
	}

	private async storage() {
		if (!this._storage) this._storage = await navigator.storage.getDirectory();
		return this._storage;
	}
}
