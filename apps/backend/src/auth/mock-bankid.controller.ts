import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  issueAuthCode,
  type BankIdProvider,
  type MockClaims,
} from './bankid.store';

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });
}

@Controller('mock-bankid')
export class MockBankIdController {
  @Get('authorize')
  authorize(
    @Query('redirect_uri') redirectUri: string,
    @Query('state') state: string,
    @Query('nonce') nonce: string,
    @Query('provider') provider: BankIdProvider,
    @Res() res: Response,
  ) {
    const prov: BankIdProvider = provider === 'privat' ? 'privat' : 'mono';

    const namePattern = "^[\\p{L}][\\p{L}\\s'’\\-]{1,49}$";

    const phonePattern = '^\\+380\\d{9}$';
    const phoneMaxLen = 13;

    const html = `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mock BankID — ${esc(prov)}</title>
    <style>
      :root{
        --bg: #fafafa;
        --card: #ffffff;
        --text: rgba(0,0,0,.86);
        --muted: rgba(0,0,0,.55);
        --border: rgba(0,0,0,.10);
        --border-strong: rgba(0,0,0,.18);
        --shadow: 0 18px 50px rgba(0,0,0,.10);
        --primary: #ff5c62;
        --primaryHover: #ff3f4a;
        --ring: rgba(255, 92, 98, .22);
        --radiusInput: 14px;
        --danger: #e11d48;
        --dangerBg: rgba(225, 29, 72, .10);
      }

      *, *::before, *::after { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: var(--bg);
        color: var(--text);
        padding: 28px 16px;
      }

      .wrap { max-width: 760px; margin: 0 auto; }
      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 28px;
        box-shadow: var(--shadow);
        padding: 22px;
      }

      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.05;
        letter-spacing: -0.02em;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(255,92,98,.12);
        color: var(--primary);
        font-weight: 800;
        font-size: 13px;
        line-height: 1;
        white-space: nowrap;
      }

      .note {
        margin: 0 0 16px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.35;
      }

      form { display: grid; gap: 12px; min-width: 0; }

      .field { display: grid; gap: 6px; min-width: 0; }
      label {
        font-size: 13px;
        font-weight: 700;
        color: rgba(0,0,0,.62);
      }

      input {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        height: 46px;
        border-radius: var(--radiusInput);
        border: 1px solid var(--border-strong);
        padding: 0 14px;
        font-size: 16px;
        outline: none;
        background: #fff;
        color: var(--text);
      }

      input::placeholder { color: rgba(0,0,0,.35); }

      input:focus {
        border-color: rgba(255, 92, 98, .55);
        box-shadow: 0 0 0 4px var(--ring);
      }

      input.isInvalid {
        border-color: rgba(225, 29, 72, .65);
        box-shadow: 0 0 0 4px rgba(225, 29, 72, .14);
      }

      .grid2 {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 12px;
        min-width: 0;
      }

      .btn {
        margin-top: 6px;
        height: 52px;
        border: 0;
        border-radius: 16px;
        background: var(--primary);
        color: #fff;
        font-weight: 800;
        font-size: 16px;
        cursor: pointer;
        width: 100%;
        transition: transform 120ms ease, background-color 150ms ease, opacity 150ms ease;
      }
      .btn:hover { background: var(--primaryHover); }
      .btn:active { transform: translateY(1px); }
      .btn:disabled { opacity: .6; cursor: default; }

      .footerHint {
        margin-top: 10px;
        font-size: 12px;
        color: rgba(0,0,0,.45);
      }

      .errorBox {
        display: none;
        margin-top: 6px;
        padding: 12px 12px;
        border-radius: 14px;
        border: 1px solid rgba(225, 29, 72, .22);
        background: var(--dangerBg);
        color: var(--danger);
        font-size: 14px;
        font-weight: 700;
        line-height: 1.35;
      }
      .errorBox.show { display: block; }

      .errorList {
        margin: 8px 0 0;
        padding-left: 18px;
        font-weight: 600;
        color: rgba(225, 29, 72, .95);
      }
      .errorList li { margin: 4px 0; }

      /* Mobile */
      @media (max-width: 560px) {
        h1 { font-size: 24px; }
        .card { padding: 18px; border-radius: 22px; }
        .grid2 { grid-template-columns: 1fr; }
      }
    </style>

    <script>
      (function() {
        const NAME_RE = new RegExp(${JSON.stringify(namePattern)}, 'u');
        const UA_PHONE_RE = new RegExp(${JSON.stringify(phonePattern)});
        const UA_PREFIX = '+380';
        const MAX_DIGITS = 12; // 380 + 9 digits (без "+")
        const MAX_LEN = ${phoneMaxLen}; // 13 (с "+")

        function digitsOnly(v) {
          return String(v || '').replace(/\\D+/g, '');
        }

        function limitDigits(d) {
          return String(d || '').slice(0, MAX_DIGITS);
        }

        // 067xxxxxxx -> +38067xxxxxxx
        // 38067xxxxxxx -> +38067xxxxxxx
        // +38067xxxxxxx -> +38067xxxxxxx
        // 67xxxxxxx (9 digits) -> +38067xxxxxxx
        function normalizeUaPhone(input) {
          const raw = String(input || '').trim();
          let d = digitsOnly(raw);
          d = limitDigits(d);

          if (!d) return UA_PREFIX;

          if (d.startsWith('0') && d.length === 10) {
            return UA_PREFIX + d.slice(1);
          }

          if (d.startsWith('380')) {
            const rest = d.slice(3);
            return UA_PREFIX + rest;
          }

          if (d.length === 9) {
            return UA_PREFIX + d;
          }

          return '+' + d; // дальше валидация зарежет
        }

        function setInvalid(input, isInvalid) {
          if (!input) return;
          if (isInvalid) input.classList.add('isInvalid');
          else input.classList.remove('isInvalid');
        }

        function showErrors(errors) {
          const box = document.getElementById('errors');
          const list = document.getElementById('errorList');
          if (!box || !list) return;

          if (!errors.length) {
            box.classList.remove('show');
            list.innerHTML = '';
            return;
          }

          box.classList.add('show');
          list.innerHTML = errors.map(e => '<li>' + e + '</li>').join('');
        }

        function normalizeSpaces(s) {
          return String(s || '').trim().replace(/\\s+/g, ' ');
        }

        function validateName(value) {
          const v = normalizeSpaces(value);
          if (/\\d/.test(v)) return { ok: false, value: v };
          return { ok: NAME_RE.test(v), value: v };
        }

        window.validateMockBankId = function(form) {
          const errors = [];

          const sub = normalizeSpaces(form.sub?.value);
          const fnRaw = form.firstName?.value || '';
          const lnRaw = form.lastName?.value || '';
          const phoneRaw = form.phone?.value || '';

          const subInvalid = !sub || sub.length < 3;
          setInvalid(form.sub, subInvalid);
          if (subInvalid) errors.push('Поле sub має містити мінімум 3 символи.');

          const fn = validateName(fnRaw);
          form.firstName.value = fn.value;
          setInvalid(form.firstName, !fn.ok);
          if (!fn.ok) errors.push("Імʼя: тільки літери (без цифр), можна пробіл/дефіс/апостроф. Мінімум 2 символи.");

          const ln = validateName(lnRaw);
          form.lastName.value = ln.value;
          setInvalid(form.lastName, !ln.ok);
          if (!ln.ok) errors.push("Прізвище: тільки літери (без цифр), можна пробіл/дефіс/апостроф. Мінімум 2 символи.");

          const phoneNorm = normalizeUaPhone(phoneRaw);
          form.phone.value = phoneNorm;

          const phInvalid = !UA_PHONE_RE.test(phoneNorm);
          setInvalid(form.phone, phInvalid);
          if (phInvalid) errors.push('Телефон має бути український у форматі +380XXXXXXXXX (9 цифр після +380).');

          showErrors(errors);

          if (errors.length) {
            try { document.getElementById('errors')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
            return false;
          }

          return true;
        };

        window.bindLiveValidation = function() {
          const form = document.getElementById('mockForm');
          if (!form) return;

          const hide = () => {
            const box = document.getElementById('errors');
            if (box) box.classList.remove('show');
          };

          const first = form.firstName;
          const last = form.lastName;
          const phone = form.phone;

          [form.sub, first, last, phone].filter(Boolean).forEach((inp) => {
            inp.addEventListener('input', () => {
              inp.classList.remove('isInvalid');
              hide();
            });
          });

          // Телефон: оставляем + и цифры, лимитим длину (и цифры тоже)
          if (phone) {
            phone.addEventListener('input', () => {
              let v = String(phone.value || '');

              // выкидываем мусор, оставляем + и цифры
              v = v.replace(/[^\\d+]/g, '');

              // если "+" не первый — убираем
              if (v.includes('+') && v[0] !== '+') v = v.replace(/\\+/g, '');

              if (v.startsWith('+')) {
                let d = limitDigits(digitsOnly(v));
                phone.value = '+' + d;
              } else {
                let d = limitDigits(digitsOnly(v));
                phone.value = d;
              }

              // финальный предохранитель по длине (на всякий)
              if (phone.value.length > MAX_LEN) {
                phone.value = phone.value.slice(0, MAX_LEN);
              }
            });

            phone.addEventListener('blur', () => {
              phone.value = normalizeUaPhone(phone.value);
            });

            // дефолт
            if (!String(phone.value || '').trim()) phone.value = '+380';
          }

          // Имена: убираем цифры на лету
          const stripDigits = (inp) => {
            inp.addEventListener('input', () => {
              inp.value = String(inp.value || '').replace(/\\d+/g, '');
            });
            inp.addEventListener('blur', () => {
              inp.value = normalizeSpaces(inp.value);
            });
          };

          if (first) stripDigits(first);
          if (last) stripDigits(last);
        };
      })();
    </script>
  </head>

  <body onload="bindLiveValidation()">
    <div class="wrap">
      <div class="card">
        <div class="head">
          <h1>Mock BankID</h1>
          <span class="pill">${esc(prov)}</span>
        </div>

        <p class="note">
          Це мок провайдера. Імітуємо redirect-flow: authorize → confirm → callback.
        </p>

        <form id="mockForm" method="GET" action="/mock-bankid/confirm" onsubmit="return validateMockBankId(this)">
          <input type="hidden" name="redirect_uri" value="${esc(redirectUri)}" />
          <input type="hidden" name="state" value="${esc(state)}" />
          <input type="hidden" name="nonce" value="${esc(nonce)}" />
          <input type="hidden" name="provider" value="${esc(prov)}" />

          <div class="field">
            <label>sub (унікальний id користувача у провайдера)</label>
            <input
              name="sub"
              value="${esc(prov)}-${esc(state.slice(0, 8))}"
              required
              minlength="3"
              title="Мінімум 3 символи"
              autocomplete="off"
            />
          </div>

          <div class="grid2">
            <div class="field">
              <label>Імʼя</label>
              <input
                name="firstName"
                placeholder="Імʼя"
                required
                pattern="${esc(namePattern)}"
                title="Тільки літери (без цифр), можна пробіл/дефіс/апостроф. Мінімум 2 символи."
                autocomplete="given-name"
              />
            </div>
            <div class="field">
              <label>Прізвище</label>
              <input
                name="lastName"
                placeholder="Прізвище"
                required
                pattern="${esc(namePattern)}"
                title="Тільки літери (без цифр), можна пробіл/дефіс/апостроф. Мінімум 2 символи."
                autocomplete="family-name"
              />
            </div>
          </div>

          <div class="field">
            <label>Телефон (+380XXXXXXXXX)</label>
            <input
              name="phone"
              placeholder="+380XXXXXXXXX"
              required
              inputmode="numeric"
              pattern="${esc(phonePattern)}"
              minlength="${phoneMaxLen}"
              maxlength="${phoneMaxLen}"
              title="Український номер: +380 і 9 цифр після нього (наприклад, +380671234567)."
              autocomplete="tel"
            />
          </div>

          <div id="errors" class="errorBox" role="alert" aria-live="polite">
            Перевірте форму:
            <ul id="errorList" class="errorList"></ul>
          </div>

          <button class="btn" type="submit">Підтвердити</button>

          <div class="footerHint">
            Порада: можна вводити 067..., 380... або +380... — ми нормалізуємо до +380XXXXXXXXX.
          </div>
        </form>
      </div>
    </div>
  </body>
</html>`;

    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  }

  @Get('confirm')
  confirm(
    @Query('redirect_uri') redirectUri: string,
    @Query('state') state: string,
    @Query('provider') provider: BankIdProvider,
    @Query('sub') sub: string,
    @Query('firstName') firstName: string,
    @Query('lastName') lastName: string,
    @Query('phone') phone: string,
    @Res() res: Response,
  ) {
    const prov: BankIdProvider = provider === 'privat' ? 'privat' : 'mono';

    const clean = (v: string) =>
      String(v || '')
        .trim()
        .replace(/\s+/g, ' ');

    const claims: MockClaims = {
      sub: clean(sub) || `${prov}-user`,
      firstName: clean(firstName) || 'User',
      lastName: clean(lastName) || 'Mock',
      phone: clean(phone) || '+380671111111',
    };

    const code = issueAuthCode(prov, claims);

    const url = new URL(redirectUri);
    url.searchParams.set('code', code);
    url.searchParams.set('state', state);

    res.redirect(url.toString());
  }
}
