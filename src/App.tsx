import { useEffect, useState } from 'react';
import { BrowserFileProvider } from './fs/BrowserFileProvider';
import { Uri } from './fs/internal/FileProvider';
import Path from './fs/internal/Path';

const storage = new BrowserFileProvider();

const App = () => {
	const [items, setItems] = useState<Uri[]>([]);
	const [path, setPath] = useState('');

	const updateItems = async () => {
		// await storage.write(new Path('empty/sss.txt'), '123');
		// await storage.delete(new Path('empty/sss.txt'));

		await storage.deleteEmptyFolders(new Path(''));
		setItems(await storage.getItems(new Path(path)));
	};

	useEffect(() => {
		updateItems();
	}, [path]);

	return (
		<div>
			<p>StorageId: {storage.getStorageId()}</p>
			<input onChange={(x) => setPath(x.target.value)}></input>
			{items && (
				<div>
					{items.map((x) => (
						<p key={x.path.value}>
							{x.isFolder ? '📂\t' : '📄\t'}
							{x.path.value}
						</p>
					))}
				</div>
			)}
		</div>
	);
};

export default App;
