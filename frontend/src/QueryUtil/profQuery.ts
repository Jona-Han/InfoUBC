export function getBestProfs(dept: string, number: string) {
	return {
		WHERE: {
			AND: [
				{
					IS: {
						sections_dept: dept,
					},
				},
				{
					IS: {
						sections_id: number,
					},
				},
				{
					NOT: {
						IS: {
							sections_instructor: "",
						},
					},
				},
			],
		},
		OPTIONS: {
			COLUMNS: ["sections_instructor", "classAverage", "timesTaught"],
			ORDER: {
				keys: ["classAverage"],
				dir: "DOWN",
			},
		},
		TRANSFORMATIONS: {
			GROUP: ["sections_instructor"],
			APPLY: [
				{
					classAverage: {
						AVG: "sections_avg",
					},
				},
				{
					timesTaught: {
						COUNT: "sections_uuid",
					},
				},
			],
		},
	};
}
