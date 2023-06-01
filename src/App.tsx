import { useEffect, useState } from 'react';
import { BrowserFileProvider } from './fs/BrowserFileProvider';
import { Uri } from './fs/internal/FileProvider';
import Path from './fs/internal/Path';

const storage = new BrowserFileProvider();

const App = () => {
	const [items, setItems] = useState<Uri[]>([]);
	const [root, setRoot] = useState<string>('');

	const updateItems = async () => {
		// await storage.write(new Path('test/sss.txt'), '123');
		setItems(await storage.getItems(new Path(root)));
	};

	useEffect(() => {
		updateItems();
	}, [root]);

	return (
		<div>
			<p>StorageId: {storage.getStorageId()}</p>
			<input onChange={(x) => setRoot(x.target.value)}></input>
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
