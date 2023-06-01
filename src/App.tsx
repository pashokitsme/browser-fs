import { useEffect, useState } from 'react';
import { BrowserFileProvider } from './fs/BrowserFileProvider';
import { Uri } from './fs/internal/FileProvider';
import Path from './fs/internal/Path';

const storage = new BrowserFileProvider();

const App = () => {
	const [items, setItems] = useState<Uri[]>([]);
	const [readTarget, setReadTarget] = useState('');
	const [data, setData] = useState('');
	const [path, setPath] = useState('');

	const read = async () => {
		const data = await storage.read(new Path(readTarget));
		setData(data);
	};

	const updateItems = async () => {
		// await storage.write(new Path('empty/sss.txt'), '123');
		// await storage.delete(new Path('empty/sss.txt'));

		await storage.deleteEmptyFolders(new Path(''));
		setItems(await storage.getItems(new Path(path)));
	};

	useEffect(() => {
		updateItems();
	}, [path]);

	useEffect(() => {
		read();
	}, [readTarget]);

	return (
		<div>
			<p>StorageId: {storage.getStorageId()}</p>
			<div>
				<span>Path: </span>
				<input onChange={(x) => setPath(x.target.value)}></input>
			</div>
			<div>
				<span>Read: </span>
				<input onChange={(x) => setReadTarget(x.target.value)}></input>
			</div>
			{data && <div>Readed: {data}</div>}
			{items && (
				<div>
					{items.map((x) => (
						<div>
							<button onClick={() => storage.delete(x.path)}>🗑️</button>
							<span key={x.path.value}>
								{x.isFolder ? '📂\t' : '📄\t'}
								{x.path.value}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default App;
