class Path {
	private _path: string;

	constructor(path: string | string[] = '') {
		if (!path) path = '';
		if (typeof path !== 'string') path = this._parseArrayPath(path);
		this._path = path;
		this._normalize();
	}

	get value() {
		return this._path;
	}

	get parentDirectoryPath(): Path {
		const parenDirectoryPath = this._path.match(/(.+)[\/\\]/)?.[1];
		if (!parenDirectoryPath) return new Path();
		return new Path(parenDirectoryPath);
	}

	get name(): string {
		return this._path.match(/([^.\\/]+)(\.[^.\\/]+)?$/)?.[1] ?? null;
	}

	get nameWithExtension(): string {
		return this._path.match(/([^\\/]+)$/)?.[1] ?? null;
	}

	get extension(): string {
		const index = this._path.lastIndexOf('/');
		return this._path.slice(index == -1 ? 0 : index).match(/\.([^.]+)$/)?.[1] ?? null;
	}

	set extension(value: string) {
		let v = value?.match(/(^[a-zA-Z]*)/);
		if (!this.extension && v) this._path = this._path + '.' + v[0];
	}

	get stripExtension(): string {
		if (!this.extension) return this._path;
		return this._path.match(/(.*)\.[^.]+$/)?.[1] ?? null;
	}

	get stripDotsAndExtension(): string {
		return this._path.match(/([^.]+)(\.[^.\\/]+)?$/)?.[1] ?? null;
	}

	get rootDirectory(): Path {
		const pathComponents = this._path.split('/');
		const firstComponent = pathComponents[0];

		if (firstComponent === '.') {
			return new Path(`${firstComponent}/${pathComponents[1]}`);
		} else if (firstComponent === '..' || firstComponent === '...') {
			return new Path(`${firstComponent}/${pathComponents[1]}`);
		} else if (this._path.startsWith('/')) {
			return new Path(`/${pathComponents[1]}`);
		} else {
			return new Path(firstComponent);
		}
	}

	get removeExtraSymbols(): Path {
		return new Path(this._path.match(/^(\.?\/)?(.*)/)?.[2] ?? null);
	}

	toString() {
		return this._path;
	}

	compare(path: Path) {
		return path.removeExtraSymbols.value == this.removeExtraSymbols.value;
	}

	startsWith(path: Path) {
		return this.removeExtraSymbols.value.startsWith(path.removeExtraSymbols.value);
	}

	endsWith(path: Path) {
		return this.removeExtraSymbols.value.endsWith(path.removeExtraSymbols.value);
	}

	includes(path: Path) {
		return this._path.includes(path._path);
	}

	subDirectory(path: Path): Path {
		if (path.value.slice(0, this._path.length) != this._path) return null;
		return new Path(path.value.slice(this._path.length));
	}

	getRelativePath(path: Path): Path {
		let generalPath = this.parentDirectoryPath;
		let depthCount = this.extension ? 0 : 1;
		while (!path.startsWith(generalPath)) {
			generalPath = generalPath.parentDirectoryPath;
			depthCount++;
		}
		if (generalPath._path == path._path) depthCount++;
		return new Path(
			'.' +
				'/..'.repeat(depthCount) +
				(generalPath._path == path._path ? '/' + path.name : generalPath.subDirectory(path).value),
		);
	}

	join(...path: Path[]): Path {
		path = path.filter((p) => p);
		let joinPath: Path = this;
		path.forEach((p) => {
			if (!p._path) return;
			joinPath = joinPath._join(p);
		});
		return joinPath;
	}

	concat(...path: Path[]): Path {
		const paths = path.filter((p) => p).map((p) => p.value);
		return new Path(this._path.concat(...paths));
	}

	getNewName(newFileName: string) {
		return new Path(
			this.parentDirectoryPath.value +
				`/${newFileName}${this.extension ? `.${this.extension}` : ''}`,
		);
	}

	private _parseArrayPath(path: string[]) {
		return path.filter((p) => p).join('/') ?? '';
	}

	private _join(path: Path): Path {
		const isRootJoin =
			path._path.slice(0, 5) == './...' ||
			path._path.slice(0, 4) == '/...' ||
			path._path.slice(0, 3) == '...';
		const newPath = isRootJoin
			? this.rootDirectory.toString() + path._path.slice(path._path.indexOf('/'))
			: this._path + '/' + path._path;

		return new Path(newPath);
	}

	private _normalize() {
		this._path = this._path.replace(/\\/g, '/');
	}
}

export default Path;
