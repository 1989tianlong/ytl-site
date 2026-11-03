---
title: 从 AI-Infra-Guard 学到的工程实践
date: 2026-11-03
summary: 读腾讯朱雀实验室 AI-Infra-Guard 的 README 与架构演进：五个扫描器如何拆开用，v0.1 到 v3.6+ 的形态，以及能带走的工程做法。
tags:
  - 工程实践
  - 安全
  - AI-Infra-Guard
draft: false
---

这篇笔记只写仓库里能对上的事实。对照日期是 2026-11-03，对象是 [Tencent/AI-Infra-Guard](https://github.com/Tencent/AI-Infra-Guard) 默认分支上的英文 README、中文 README（`readme/README_ZH.md`）和 `docs/architecture_evolution.md`。命令摘自 README 的最短示例，只对你有授权的目标使用。文末单独列出没有写成事实的推断。

## 它是什么

A.I.G（AI-Infra-Guard）是腾讯朱雀实验室开源的一站式 AI 红队平台。中文 README 写明：项目由腾讯安全平台部朱雀实验室主导，实验室 2019 年成立。协议是 Apache-2.0。

英文 README 开头列出的组合是：OpenClaw 安全体检、Agent 安全扫描、AI 工具与技能扫描、AI 基础设施漏洞扫描，以及大模型安全体检（越狱评估）。在线文档在 [tencent.github.io/AI-Infra-Guard](https://tencent.github.io/AI-Infra-Guard/)。

Web 用 Docker Compose 拉起，文档给出的地址是 `http://localhost:8088`。环境：Docker 20.10 或更高，内存 4GB+，磁盘 10GB+。三条安装路径：

1. 预构建镜像：`docker-compose -f docker-compose.images.yml up -d`。Compose V2 写成 `docker compose`。
2. 一键脚本：仓库里的 `docker.sh`。README 标为推荐，会先安装 Docker 再启动。
3. 源码构建：在仓库根目录 `docker-compose up -d`（同样留意 V2 的写法）。

> 中英 README 是同一条限制：定位为企业或个人内部使用，目前暂无鉴权，不要部署在公网。

## 五个扫描器，可以不启 Web

「独立调用」写明五个扫描器都能单独 `pip install`，不必先起 Web。参数以各目录 README 为准：`infra-scan/`、`AIG-PromptSecurity/`、`mcp-scan/`、`skill-scan/`、`agent-scan/`。这一节没有第六条 OpenClaw 命令，所以这里不把 OpenClaw 写成另一个 pip 包。

### AI 基础设施扫描

扫域名、IP 或 URL，匹配指纹和漏洞。

```bash
pip install aig-infra-scan
aig-infra-scan -t https://example.com
```

### 大模型体检 / 越狱

目标要暴露 OpenAI 兼容接口。

```bash
pip install aig-model-scan
aig-model-scan \
  --model "gpt-4o-mini" \
  --base_url "https://api.openai.com/v1" \
  --api_key "your-api-key" \
  --max_concurrent 10 \
  --scenarios Bias \
  --techniques Raw
```

### MCP 扫描

扫 MCP Server 源码目录，或连接已经在跑的服务。最短示例把结果写到 `result.sarif.json`。

```bash
pip install aig-mcp-scan
export LLM_API_KEY="your-api-key"
aig-mcp-scan --repo /path/to/mcp-server -o result.sarif.json
```

### Skill 扫描

审计本地 Agent Skill 目录。最短示例同样写成 `result.sarif.json`。

```bash
pip install aig-skill-scan
export LLM_API_KEY="your-api-key"
aig-skill-scan --repo /path/to/your/skill -o result.sarif.json
```

### Agent 扫描

向正在运行的 Agent 发测试提示。`target.yaml` 描述被测 Agent；密钥给扫描器自己用的模型。示例输出是 `result.json`，不是 SARIF 文件名。

```bash
pip install aig-agent-scan
export LLM_API_KEY="your-api-key"
aig-agent-scan --agent_provider target.yaml -o result.json
```

## 架构怎么从 v0.1 长到 v3.6+

`docs/architecture_evolution.md` 把演进收成三段：v0.1、v2.6、v3.6.0+。它关心职责边界、能力增长和运行拓扑。

### v0.1：Go 单二进制

目的句是：轻量、零依赖的 AI 基础设施漏洞扫描器，先交付、先能扫。

- 对 AI 服务做网络指纹。文档举例：Ollama、vLLM、Dify 等。
- 用规则把扫到的组件对上 CVE/GHSA。
- 任务以 CLI 为主，入口 `cmd/cli`；WebUI 用来看结果。配置是 CLI 参数和 YAML 规则。
- 分层：入口 → 任务调度（切目标、控并发）→ 规则引擎（指纹匹配、漏洞打分）→ 探针（HTTP、服务识别）→ 规则数据（`data/fingerprints/`、`data/vuln/`）。
- 运行路径：CLI/WebUI → 调度（文档写成 `runner.go`）→ 指纹引擎抽出版本 → 漏洞匹配 → 结构化结果。

### v2.6：仍是 Go 单二进制，两套引擎

在 v0.1 上增加 MCP Server 代码安全分析。一个二进制里同时有规则扫描器和 LLM 辅助的代码审计。

- MCP 分析是静态规则加 LLM 推理。
- CLI 子命令收成 `scan` / `mcp`，WebUI 覆盖两种扫描。
- 任务管理走 WebSocket/REST。
- 新模块：`internal/mcp/`、`common/websocket/`。模型接入是 OpenAI 兼容 API，文件写在 `common/utils/models/openai.go`。
- 数据层在指纹和漏洞之外，加上 MCP 规则 YAML。

### v3.6.0+：Go + Python 的多模块平台

文档把这一段定义为平台级系统：Go 与 Python 混合，扫描引擎 hot-pluggable（可热插拔），部署画像写了 on-prem、SaaS、开源发行。交付形态是 Docker 镜像加 Compose，或仍可以单二进制。

文档点名的新能力：

- **Prompt 评测**（`AIG-PromptSecurity/`）：大模型越狱红队，10 种以上攻击策略（编码、隐写、角色扮演等）。技术表写明 Python，可独立运行。分层图上的字是 Python DeepTeam、10+ 攻击类型、数据集驱动。
- **Agent 扫描**（`common/agent/`）：对 Agent 工作流做多智能体评估，举例 Dify、Coze，覆盖间接提示注入、SSRF、系统提示泄露。运行流把这一路标成 Go agent。
- **MCP Scan v2**（`mcp-scan/`）：重写成独立 Python agent，含动态验证、代码审计流水线和多阶段 LLM 推理。
- Docker Compose 一键部署，多镜像；另有插件 / 功能扩展框架。
- 任务调度在 `common/websocket/`。报告层写了任务调度、结果汇总、PDF 报告生成。

版本对照（架构文档原表的压缩）：

| 版本 | 能力 | 技术栈 | 形态 |
| --- | --- | --- | --- |
| v0.1 | AI 基础设施漏洞扫描 + WebUI | Go 单二进制 | 单体，规则驱动 |
| v2.6 | 基础设施扫描 + MCP 代码分析 | Go 单二进制 | 双引擎，统一 WebUI |
| v3.6.0+ | 基础设施 + MCP + Agent + Prompt 评测 | Go + Python，Docker | 多模块，引擎可插拔 |

分层图中间是三列：AI Infra、MCP、Prompt Eval。这和正文里的 “three coordinated security modules” 对得上。同一篇文档的运行流和版本表又把 Agent Scan 列了进去。Skill Scan 在这篇演进文档里没有出现；它出现在当前 README 的五个独立扫描器中。本文不替 Skill Scan 编一个版本号。

还有两处不宜揉成一句。架构文档的 Agent 扫描写在 Go 的 `common/agent/`；当前 README 的独立用法是 Python 包 `aig-agent-scan`（目录 `agent-scan/`）。两处都写了 Agent 扫描，没有说明是不是同一条代码路径。部署画像的图上写着 On-prem (SSO/intranet)。鉴权现状以 README 为准：目前暂无鉴权。不要从画像上的 SSO 字样推断鉴权已经可用。

## 文档里写明的四条设计

下面四条来自架构文档的 Key Design Decisions。

1. **规则优先，LLM 增强。** 主干检测保持确定：YAML 指纹加漏洞规则，换速度和一致性。LLM 叠在复杂场景上，文档点名 MCP 代码审计和 Agent 模拟。
2. **按职责分语言。** Go 负责高并发网络探针和 Web 平台。Python 负责 LLM agent loop、评测框架，以及靠近机器学习的工具。
3. **数据即真相。** 检测规则放在 `data/`，用版本化 YAML，不编译进二进制。文档写的后果是：规则可以带外更新，也可以做 CI 校验。贡献指南把落点写死了：指纹 `data/fingerprints/`，漏洞 `data/vuln/`，MCP `data/mcp/`，模型评测集 `data/eval`。v3.6 的数据层图里还有 `data/vuln(_en)/`。
4. **引擎可插拔。** 从 v3.6.0+ 起，各扫描模块（infra、MCP、agent、prompt）可以独立部署、独立版本，经任务 API 接在一起。

## 笔记里的做法

这一节是读完上面几份文档之后的做法，不是上游指标，也没有性能数字。

1. 安全能力先拆成「确定性规则」和「模型判断」。能复现的匹配留给规则，规则写不清的推理才交给模型。
2. 规则和引擎分开存放。贡献方式已经是往 `data/` 提 PR；文档又写了规则不进二进制、可以带外更新。发版节奏因此可以错开，这是这一设计的推论，不是仓库里的发版政策。
3. 试用入口和平台入口分开写。README 用五个 pip 包让人不必先起 Compose；架构文档写各模块可独立部署，再经任务 API 编排。每个 pip 包是不是平台进程的薄封装，演进文档没有逐包证明，试用时以对应 README 为准。
4. 对外格式跟文档走。MCP 和 Skill 的最短示例把文件写成 `result.sarif.json`，接会读 SARIF 的 CI 时有现成文件名。Agent 示例是 `result.json`。不要假设五条流水线都是 SARIF。
5. 部署边界写在安装说明旁边。没有鉴权，就只放在受控网络里。
6. 架构演进单独成文。要回答「为什么现在长这样」，`docs/architecture_evolution.md` 比 README 的功能清单更合适。

## 不写成事实的推断

- 不把 Skill Scan 归进 v0.1、v2.6 或 v3.6.0+。演进文档的版本表没有它。
- 不把 `aig-agent-scan` 和 `common/agent/` 说成同一个实现。
- 不把五个 pip 包和 Compose 里的服务说成必然同一份代码。文档写的是独立部署，以及经任务 API 连接。
- 不从部署画像里的 SSO 推断鉴权已经做好。
- 不把 OpenClaw 安全体检写成第六个独立 CLI。README 正文提到了它，「独立调用」没有给出对应命令。

## 来源

- 仓库：<https://github.com/Tencent/AI-Infra-Guard>
- 英文 README：<https://github.com/Tencent/AI-Infra-Guard/blob/main/README.md>
- 中文 README：<https://github.com/Tencent/AI-Infra-Guard/blob/main/readme/README_ZH.md>
- 架构演进：<https://github.com/Tencent/AI-Infra-Guard/blob/main/docs/architecture_evolution.md>
- 在线文档：<https://tencent.github.io/AI-Infra-Guard/>
- 安装说明：<https://tencent.github.io/AI-Infra-Guard/?menu=getting-started>

## 署名

本笔记引用腾讯朱雀实验室开源的 AI-Infra-Guard。笔记作者没有把它的代码或扫描引擎当作自己的产品。

项目以 Apache License 2.0 开源。仓库的 License & Attribution 要求：分发时保留 `LICENSE` 与 `NOTICE`；若把核心代码、组件或扫描引擎集成进自己的开源项目、商业产品或内部平台，需在产品文档、使用说明或界面「关于」中写明集成了腾讯朱雀实验室开源的 [AI-Infra-Guard](https://github.com/Tencent/AI-Infra-Guard)；在漏洞分析、安全研究文章或论文等公开材料里使用该工具时，写明「腾讯朱雀实验室 AI-Infra-Guard」并附上仓库链接。禁止隐去出处后重新包装成原创产品。

本文是学习笔记，没有集成其扫描引擎。引用名：腾讯朱雀实验室 AI-Infra-Guard。仓库建议的引用条目是 `Tencent_AI-Infra-Guard_2025`（作者 Tencent Zhuque Lab，年份 2025）。仓库：<https://github.com/Tencent/AI-Infra-Guard>。
