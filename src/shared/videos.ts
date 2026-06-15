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
		name: "奶龙舞",
		durationSeconds: 15.033,
		url: "/videos/bounce.mp4",
		description: "奶龙短舞蹈，节奏轻快，适合作为开场内容。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "fork-shake",
		type: "video",
		name: "叉子摇",
		durationSeconds: 15.1,
		url: "/videos/fork-shake.mp4",
		description: "奶龙叉子摇，包含叉子摇、奶龙捧腹大笑和元梦之星相关内容。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "macho-hot-dance",
		type: "video",
		name: "猛男热舞",
		durationSeconds: 51.866,
		url: "/videos/macho-hot-dance.mp4",
		description: "猛男奶蛙在线热舞，偏鬼畜舞蹈风格。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "slow-shake",
		type: "video",
		name: "慢摇舞",
		durationSeconds: 10.133,
		url: "/videos/slow-shake.mp4",
		description: "奶蛙慢摇，主打曼妙身材和慢节奏摆动。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "performance",
		type: "video",
		name: "献舞",
		durationSeconds: 15.067,
		url: "/videos/performance.mp4",
		description: "奶蛙献舞给大家，偏表演向竖屏视频。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "rap-basketball",
		type: "video",
		name: "唱跳舞",
		durationSeconds: 1.8,
		url: "/videos/rap-basketball.mp4",
		description: "喜欢唱、跳、rap、篮球的奶蛙极短节奏片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "wechat-card-dance",
		type: "video",
		name: "微信舞",
		durationSeconds: 9.467,
		url: "/videos/wechat-card-dance.mp4",
		description: "姐姐微信来啦，奶蛙卡点舞短视频。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "fancy-dance",
		type: "video",
		name: "炫舞",
		durationSeconds: 10.681,
		url: "/videos/fancy-dance.mp4",
		description: "奶蛙炫舞时刻，包含奶龙和奶龙表情包相关内容。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "simple",
		type: "video",
		name: "奶蛙舞",
		durationSeconds: 31.4,
		url: "/videos/simple.mp4",
		description: "奶蛙主题竖屏舞蹈视频，动作简洁直接。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "houyi-dance",
		type: "video",
		name: "后裔舞",
		durationSeconds: 11.8,
		url: "/videos/houyi-dance.mp4",
		description: "奶蛙申请出战，性感奶龙和后裔舞主题片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "jia-tong-yao",
		type: "video",
		name: "嘉桐摇",
		durationSeconds: 9.567,
		url: "/videos/jia-tong-yao.mp4",
		description: "诶诶诶诶，奶蛙萌物嘉桐摇剪影片段。",
		notes: "来源记录见 processed/README.md",
	},
	{
		id: "milktea-shake",
		type: "video",
		name: "奶茶摇",
		durationSeconds: 15.1,
		url: "/videos/milktea-shake.mp4",
		description: "AI 创作浪潮计划里的奶蛙奶茶摇片段。",
		notes: "来源记录见 processed/README.md",
	},
]);

export const videoById = new Map(videos.map((video) => [video.id, video]));

export function getVideoById(videoId: string) {
	return videoById.get(videoId);
}
