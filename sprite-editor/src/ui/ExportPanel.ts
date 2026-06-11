import { toExported, type AnimationConfig } from '../types/AnimationConfig';

/** Bottom of the left panel: live JSON view of the config + copy button. */
export class ExportPanel {
  private readonly config: AnimationConfig;
  private readonly jsonView: HTMLElement;
  private readonly copyButton: HTMLButtonElement;
  private resetTimer: number | null = null;

  constructor(mount: HTMLElement, config: AnimationConfig) {
    this.config = config;

    const section = document.createElement('div');
    section.className = 'panel-section';
    section.innerHTML = `
      <div class="panel-title">Export</div>
      <pre id="export-json"></pre>
      <button id="btn-copy" type="button">COPY JSON</button>`;
    mount.appendChild(section);

    const jsonView = section.querySelector('#export-json');
    const copyButton = section.querySelector('#btn-copy');
    if (!(jsonView instanceof HTMLElement) || !(copyButton instanceof HTMLButtonElement)) {
      throw new Error('Export panel mount failed');
    }
    this.jsonView = jsonView;
    this.copyButton = copyButton;

    this.copyButton.addEventListener('click', () => void this.copy());
    this.refresh();
  }

  get json(): string {
    return JSON.stringify(toExported(this.config), null, 2);
  }

  refresh(): void {
    this.jsonView.textContent = this.json;
  }

  private async copy(): Promise<void> {
    let label: string;
    try {
      await navigator.clipboard.writeText(this.json);
      label = 'COPIED ✓';
      this.copyButton.classList.add('copied');
    } catch {
      label = 'CLIPBOARD BLOCKED';
    }
    this.copyButton.textContent = label;
    if (this.resetTimer !== null) window.clearTimeout(this.resetTimer);
    this.resetTimer = window.setTimeout(() => {
      this.copyButton.textContent = 'COPY JSON';
      this.copyButton.classList.remove('copied');
    }, 1400);
  }
}
