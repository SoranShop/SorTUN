import { useEffect, useState } from "react";
import { api } from "./api";
import { copyText } from "./clipboard";
import { useApp } from "./store";
import { Card, Icon, Seg } from "./ui";

/** Settings > Prometheus: `/metrics` for a scraper, behind a token shown once. */
export function MetricsSection() {
  const { t, toast } = useApp();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  // The panel's own address with its secret path, where the scrape goes.
  const url = new URL("./metrics", window.location.href.split("#")[0]).href;

  useEffect(() => {
    let alive = true;
    api
      .metrics()
      .then((v) => alive && setEnabled(v.enabled))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const change = async (on: boolean) => {
    setBusy(true);
    try {
      const v = await api.metricsSet(on);
      setEnabled(v.enabled);
      setToken(v.token ?? "");
    } catch (e) {
      toast(String(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    if (await copyText(text)) toast(t("met.copied"), "ok");
    else toast(t("met.copyFailed"));
  };

  const config = `- job_name: sortun
  metrics_path: ${new URL(url).pathname}
  scheme: ${new URL(url).protocol.replace(":", "")}
  authorization:
    credentials: ${token || "<token>"}
  static_configs:
    - targets: ["${new URL(url).host}"]`;

  return (
    <Card title={t("set.metrics")} sub={t("met.sub")}>
      <div className="set-row">
        <div>
          <h3>{t("met.title")}</h3>
          <p>{t(enabled ? "met.onText" : "met.offText")}</p>
        </div>
        <div className="ctl">
          {enabled !== null && (
            <Seg
              value={enabled ? "on" : "off"}
              options={[
                ["on", t("tg.on")],
                ["off", t("tg.off")],
              ]}
              onChange={(v) => !busy && change(v === "on")}
            />
          )}
        </div>
      </div>
      {enabled && (
        <>
          <div className="set-row">
            <div>
              <h3>{t("met.url")}</h3>
              <p dir="ltr" className="mono">{url}</p>
            </div>
            <div className="ctl">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => copy(url)}>
                <Icon name="copy" size={18} />
                {t("met.copy")}
              </button>
            </div>
          </div>
          <div className="set-row">
            <div>
              <h3>{t("met.token")}</h3>
              <p>{t(token ? "met.tokenOnce" : "met.tokenHidden")}</p>
              {token && <p dir="ltr" className="mono">{token}</p>}
            </div>
            <div className="ctl">
              {token ? (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => copy(token)}>
                  <Icon name="copy" size={18} />
                  {t("met.copy")}
                </button>
              ) : (
                <button className="btn btn-ghost btn-sm" type="button" disabled={busy} onClick={() => change(true)}>
                  <Icon name="key" size={18} />
                  {t("met.newToken")}
                </button>
              )}
            </div>
          </div>
          <div className="set-row">
            <div>
              <h3>{t("met.config")}</h3>
              <pre dir="ltr" className="mono" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {config}
              </pre>
            </div>
            <div className="ctl">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => copy(config)}>
                <Icon name="copy" size={18} />
                {t("met.copy")}
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
