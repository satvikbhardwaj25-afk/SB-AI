import { Router, type IRouter } from "express";
import {
  SendChatMessageBody,
  SendChatMessageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEFAULT_MODEL = "openai/gpt-oss-20b:free";

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

router.post("/chat", async (req, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Please provide a valid conversation.",
    });
    return;
  }

  const apiKey = process.env["OPENROUTER_API_KEY"];

  if (!apiKey) {
    res.status(503).json({
      error: "OpenRouter is not configured yet.",
    });
    return;
  }

  const model =
    process.env["OPENROUTER_MODEL"] || DEFAULT_MODEL;

  const messages = [
    {
      role: "system",
      content:
        "You are SB.ai, a helpful, concise, and thoughtful open-source AI assistant. Answer clearly and be honest when you are uncertain.",
    },
    ...parsed.data.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      },
    );

    const payload =
      (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      req.log.warn(
        {
          status: response.status,
          providerMessage: payload.error?.message,
        },
        "OpenRouter request failed",
      );

      res.status(502).json({
        error: "The model could not answer right now.",
      });
      return;
    }

    const content =
      payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      res.status(502).json({
        error: "The model returned an empty response.",
      });
      return;
    }

    const data = SendChatMessageResponse.parse({
      message: {
        role: "assistant",
        content,
      },
      model,
    });

    res.json(data);
  } catch (error) {
    req.log.error(
      { err: error },
      "Unexpected OpenRouter request error",
    );

    res.status(502).json({
      error: "The model could not answer right now.",
    });
  }
});

export default router;