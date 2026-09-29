import { en } from "./en";
import { es } from "./es";
import type { Locale } from "./locales";

type English = typeof en;

/** Every locale must provide the same keys, with the same parameters. */
export type Dictionary = {
  [K in keyof English]: English[K] extends (p: infer P) => string ? (p: P) => string : string;
};

export type MessageKey = keyof English;

type ParamsOf<K extends MessageKey> = English[K] extends (p: infer P) => string ? P : never;

/** String params may also be nested messages (a list is joined with ", "). */
type MessageParams<P> = { [N in keyof P]: P[N] extends string ? string | Message | Message[] : P[N] };

/**
 * A translatable message: a key plus its parameters. Serializable, so it can
 * travel in the API response and be re-rendered in any locale on the client.
 */
export type Message = {
  [K in MessageKey]: [ParamsOf<K>] extends [never]
    ? { key: K; params?: undefined }
    : { key: K; params: MessageParams<ParamsOf<K>> };
}[MessageKey];

export const DICTIONARIES: Record<Locale, Dictionary> = { en, es };

function isMessage(v: unknown): v is Message {
  return typeof v === "object" && v !== null && "key" in v;
}

export function translate(locale: Locale, msg: Message): string {
  const entry = DICTIONARIES[locale][msg.key] as string | ((p: Record<string, unknown>) => string);
  if (typeof entry === "string") return entry;
  const params: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(msg.params ?? {})) {
    if (Array.isArray(value)) params[name] = value.map((m) => translate(locale, m)).join(", ");
    else if (isMessage(value)) params[name] = translate(locale, value);
    else params[name] = value;
  }
  return entry(params);
}

/** Build a message with type-checked params. */
export function msg<K extends MessageKey>(
  key: K,
  ...params: [ParamsOf<K>] extends [never] ? [] : [MessageParams<ParamsOf<K>>]
): Message {
  return (params.length ? { key, params: params[0] } : { key }) as Message;
}

export type Translator = <K extends MessageKey>(
  key: K,
  ...params: [ParamsOf<K>] extends [never] ? [] : [MessageParams<ParamsOf<K>>]
) => string;

export function translator(locale: Locale): Translator {
  return (key, ...params) => translate(locale, msg(key, ...params));
}

export * from "./locales";
