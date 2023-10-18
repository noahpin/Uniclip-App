declare global {
	type Block = {
		id: string;
		content: string;
		position: { x: number; y: number; w: number; h: number };
		tag_id?: string;
        date_created?: string;
        block_type: string;
	};
    type Tag = {
		id: string;
		name: string,
		color: string,
	}
}

export {};
