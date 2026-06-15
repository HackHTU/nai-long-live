import { z } from "zod";

export const videoSchema = z.object({
	id: z.string().min(1),
	type: z.literal("video"),
	name: z.string().min(1),
	durationSeconds: z.number().positive(),
	url: z.string().min(1),
	description: z.string(),
	notes: z.string(),
});

export const videosSchema = z.array(videoSchema).min(1);

export type VideoItem = z.infer<typeof videoSchema>;

export const videos = videosSchema.parse([
	{
		id: "bounce",
		type: "video",
		name: "Bounce",
		durationSeconds: 15.033,
		url: "/videos/bounce.mp4",
		description: "短舞蹈视频，节奏轻快。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "fork-shake",
		type: "video",
		name: "Fork Shake",
		durationSeconds: 15.1,
		url: "/videos/fork-shake.mp4",
		description: "竖屏舞蹈片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "macho-hot-dance",
		type: "video",
		name: "Macho Hot Dance",
		durationSeconds: 51.866,
		url: "/videos/macho-hot-dance.mp4",
		description: "较长的热舞片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "slow-shake",
		type: "video",
		name: "Slow Shake",
		durationSeconds: 10.133,
		url: "/videos/slow-shake.mp4",
		description: "慢节奏摆动片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "performance",
		type: "video",
		name: "Performance",
		durationSeconds: 15.067,
		url: "/videos/performance.mp4",
		description: "表演向竖屏视频。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "rap-basketball",
		type: "video",
		name: "Rap Basketball",
		durationSeconds: 1.8,
		url: "/videos/rap-basketball.mp4",
		description: "极短节奏片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "wechat-card-dance",
		type: "video",
		name: "WeChat Card Dance",
		durationSeconds: 9.467,
		url: "/videos/wechat-card-dance.mp4",
		description: "卡片舞蹈短视频。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "fancy-dance",
		type: "video",
		name: "Fancy Dance",
		durationSeconds: 10.681,
		url: "/videos/fancy-dance.mp4",
		description: "花式舞蹈短片。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "simple",
		type: "video",
		name: "Simple",
		durationSeconds: 31.4,
		url: "/videos/simple.mp4",
		description: "简洁竖屏舞蹈视频。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "houyi-dance",
		type: "video",
		name: "Houyi Dance",
		durationSeconds: 11.8,
		url: "/videos/houyi-dance.mp4",
		description: "后羿主题舞蹈片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "jia-tong-yao",
		type: "video",
		name: "Jia Tong Yao",
		durationSeconds: 9.567,
		url: "/videos/jia-tong-yao.mp4",
		description: "儿歌感竖屏片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "milktea-shake",
		type: "video",
		name: "Milktea Shake",
		durationSeconds: 15.1,
		url: "/videos/milktea-shake.mp4",
		description: "奶茶主题摆动短片。",
		notes: "来源记录见 processed/README.md",
	},
]);

export const videoById = new Map(videos.map((video) => [video.id, video]));

export function getVideoById(videoId: string) {
	return videoById.get(videoId);
}
