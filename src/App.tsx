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
		const path = new Path(readTarget);
		if (!storage.exists(path)) return;
		console.log(path);
		const data = await storage.read(path);
		setData(data);
	};

	const updateItems = async () => {
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
				<input onChange={(x) => setPath(x.target.value)} placeholder='filename..'></input>
			</div>
			<div>
				<span>Read: </span>
				<input onChange={(x) => setReadTarget(x.target.value)} placeholder='filename..'></input>
			</div>
			{data && (
				<div>
					<p>Readed:</p>
					{data}
				</div>
			)}
			{items && (
				<div>
					{items.map((x) => (
						<div key={x.path.value}>
							<button onClick={() => storage.delete(x.path)}>🗑️</button>
							<span>
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
