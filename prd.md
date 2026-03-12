Phase 1 产品设计文档（PRD）

Project name (暂定)：Rewild Prototype
产品类型：Web Prototype

1. 产品愿景

Rewild 是一个 AI Naturalist Companion，帮助人在自然中观察、理解和记录自然。

核心理念：

Technology should not replace observation, but deepen it.

AI 的角色不是直接给答案，而是 引导用户观察自然特征并理解生态关系。

⸻

2. Phase 1 目标

Phase 1 只验证一个问题：

AI 能否像 naturalist 一样引导用户观察自然？

成功标准：

用户使用后会觉得：
	•	“像有人在带我看自然”
	•	“AI 提醒我注意到我没注意的细节”

不追求：
	•	完美识别率
	•	完整生态系统
	•	离线能力
	•	移动端 app

⸻

3. 核心用户

早期用户：

1️⃣ 自然观察者
2️⃣ tree walk / bird walk 参与者
3️⃣ 国家公园访客
4️⃣ 城市自然爱好者

你的 volunteer group 其实就是理想测试用户。

⸻

4. 核心使用场景

场景1：城市公园观察

用户看到一棵树：
	1.	拍几张照片
	2.	上传 observation
	3.	AI 引导观察

例如：

Notice the leaf base — is it asymmetrical?

⸻

场景2：自然徒步

用户在 trail 上：
	1.	拍照记录
	2.	回家分析

⸻

场景3：观察日志

系统记录：

Today's walk
3 observations


⸻

5. Phase 1 功能范围

只做 三个核心功能。

⸻

Feature 1：Observation 输入

用户可以上传：
	•	1–4 张照片

建议照片类型：
	•	whole tree
	•	leaves
	•	bark
	•	environment

但不强制。

附加信息：

Location
Optional notes

location 可以：
	•	手动输入
	•	map pin

⸻

Feature 2：Species Hypothesis

系统输出：

Most likely species
Confidence level
Alternative candidates

来源：

植物识别 API。

⸻

Feature 3：AI Naturalist Explanation（核心）

AI 会生成：

1 Identification reasoning

解释为什么：

This tree is likely American Elm.
Notice the asymmetrical base of the leaves.


⸻

2 Guided observation

AI 提出观察问题：

Look closely at the bark texture.
Is it deeply furrowed?


⸻

3 Ecological context

例如：

American elms were widely planted in Washington DC.
Their vase-shaped canopy creates cathedral-like streets.


⸻

6. 页面结构

Page 1：首页

标题：

Rewild – Observe Nature with an AI Naturalist

按钮：

Start Observation


⸻

Page 2：Observation Upload

上传：

Upload photos
Location
Notes
Submit


⸻

Page 3：AI Analysis

显示：

Species hypothesis
Naturalist explanation
Observation prompts


⸻

7. 产品设计原则

1 Calm technology

界面简单。

不要复杂 UI。

⸻

2 Observation first

AI 先引导观察。

不是直接给答案。

⸻

3 Encourage curiosity

AI 应该问问题。

⸻

技术实现文档

Phase 1 技术目标：

快速开发 + 可迭代。

⸻

1. 技术架构

系统结构：

Frontend (Next.js)
        ↓
Backend API (FastAPI)
        ↓
Plant Identification API
        ↓
LLM reasoning


⸻

2. 技术栈

Frontend：
	•	Next.js
	•	React
	•	Tailwind CSS

Backend：
	•	Python FastAPI

AI：
	•	OpenAI API

Image recognition：
	•	PlantNet API
或
	•	PlantID API

⸻

3. 数据流程

用户上传 observation：

images
location
notes

Backend 流程：

1 send image to plant API
2 get species candidates
3 call LLM
4 generate explanation


⸻

4. Prompt 设计（关键）

Naturalist prompt：

You are a knowledgeable field naturalist guiding someone during a tree walk.

Your role is not just to identify species, but to help the user observe nature more carefully.

Explain how the plant can be identified using visible features such as leaves, bark, shape, and habitat.

Encourage the user to notice specific details in their observation.

Use a calm and curious tone.


⸻

5. API 结构

POST /observe

输入：

images
location
notes

返回：

species_candidates
naturalist_explanation
observation_prompts


⸻

6. 数据存储

Phase 1 可以非常简单：

SQLite

存储：

observations
images
AI results


⸻

7. 开发步骤

Step 1（Day 1–2）

搭建 Next.js 项目。

⸻

Step 2（Day 3–5）

实现：

image upload
location input


⸻

Step 3（Day 6–8）

接入：

plant recognition API


⸻

Step 4（Day 9–12）

接入：

LLM explanation


⸻

Step 5（Day 13–14）

优化 UI。

⸻

8. Phase 1 不做的事情

明确排除：
	•	iOS app
	•	offline AI
	•	AI glasses
	•	complex knowledge graph
	•	social features

这些都是 Phase 2+。

⸻

9. Phase 1 成功标准

测试用户（10–20人）使用后反馈：

AI explanation helpful
Feels like guided observation
Encourages curiosity


⸻

10. Phase 2 方向（未来）

未来可能增加：
	•	离线模型
	•	observation journal
	•	AI guided questions
	•	wearable integration
	•	ecological knowledge graph

⸻

如果你愿意，我其实可以再帮你做一个东西，会对你开发 极其有用：

我可以给你画一份 FloralMind / Rewild 的完整系统架构图（AI architecture），包括：
	•	vision pipeline
	•	reasoning pipeline
	•	ecological knowledge layer
	•	future wearable architecture

那一张图基本可以直接变成：
	•	技术 roadmap
	•	Medium 技术文章
	•	甚至 future 投资 pitch。