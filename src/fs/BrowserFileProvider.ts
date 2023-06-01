import { Buffer } from 'buffer';
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
		console.log(`Deleting: ${path}`);
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
				await directory.removeEntry(handle.name);
				console.info(`Deleting empty: ${path}`);
			}
		}
	}

	async write(path: Path, data: string | Buffer) {
		console.info(`Writing file ${path}`);
		const filename = path.nameWithExtension;
		const directory = await this.directory(path.rootDirectory, { useRoot: false, create: true });
		const file = await directory.getFileHandle(filename, { create: true });
		const stream = await file.createWritable({ keepExistingData: false });

		await stream.write(data);
		await stream.close();
	}

	async read(path: Path): Promise<string> {
		const data = await this.readAsBinary(path);
		const decoder = new TextDecoder();
		return decoder.decode(data);
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		return await this.readBuffer(await this.file(path));
	}

	async move(oldFilePath: Path, newFilePath: Path) {
		const handle = (await this.file(oldFilePath)) ?? (await this.directory(oldFilePath));
		return handle.kind === 'directory'
			? this.moveDirectory(handle, newFilePath)
			: this.moveFile(handle, oldFilePath, newFilePath);
	}

	private async isEmpty(directory: FileSystemDirectoryHandle) {
		for await (const _ of directory.entries()) return false;
		return true;
	}

	private async moveDirectory(directory: FileSystemDirectoryHandle, dst: Path) {
		const promises = [];
		for await (const [path, handle] of directory.entries()) {
			if (handle.kind === 'directory') {
				promises.push(
					new Promise(async () => {
						await this.moveDirectory(handle, dst.join(new Path(handle.name))).catch(console.error);
						await this.delete(new Path(path));
					}),
				);
				continue;
			}

			promises.push(
				this.moveFile(handle, new Path(path), dst.join(new Path(handle.name))).catch(console.error),
			);
		}

		await Promise.all(promises);
	}

	private async moveFile(handle: FileSystemFileHandle, from: Path, dst: Path) {
		const data = await this.readBuffer(handle);
		if (!data) return;
		await this.write(dst, data);
		await this.delete(from);
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

	private async readBuffer(handle: FileSystemFileHandle) {
		if (!handle) {
			console.warn(`File not exists`);
			return;
		}
		const file = await handle.getFile();
		const data = await file.stream().getReader().read();
		return Buffer.from(data?.value);
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
