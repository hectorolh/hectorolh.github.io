// Modern Code Block Enhancement with Copy Button
document.addEventListener('DOMContentLoaded', function () {
  const codeBlocks = document.querySelectorAll('pre');

  codeBlocks.forEach(function (pre) {
    // Only wrap if not already wrapped
    if (pre.parentNode.classList.contains('code-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    wrapper.style.position = 'relative';

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

    copyBtn.style.position = 'absolute';
    copyBtn.style.top = '10px';
    copyBtn.style.right = '12px';
    copyBtn.style.padding = '4px 10px';
    copyBtn.style.fontSize = '0.75rem';
    copyBtn.style.fontFamily = "'Fira Code', monospace";
    copyBtn.style.fontWeight = '500';
    copyBtn.style.color = '#94a3b8';
    copyBtn.style.backgroundColor = 'rgba(30, 41, 59, 0.7)';
    copyBtn.style.border = '1px solid #334155';
    copyBtn.style.borderRadius = '5px';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.transition = 'all 0.2s ease';
    copyBtn.style.zIndex = '10';

    copyBtn.addEventListener('mouseenter', function () {
      copyBtn.style.color = '#38bdf8';
      copyBtn.style.borderColor = '#38bdf8';
      copyBtn.style.backgroundColor = '#1e293b';
    });

    copyBtn.addEventListener('mouseleave', function () {
      if (copyBtn.textContent !== 'Copied!') {
        copyBtn.style.color = '#94a3b8';
        copyBtn.style.borderColor = '#334155';
        copyBtn.style.backgroundColor = 'rgba(30, 41, 59, 0.7)';
      }
    });

    copyBtn.addEventListener('click', function () {
      const code = pre.querySelector('code') || pre;
      const text = code.innerText;

      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = 'Copied!';
        copyBtn.style.color = '#22d3ee';
        copyBtn.style.borderColor = '#22d3ee';
        setTimeout(function () {
          copyBtn.textContent = 'Copy';
          copyBtn.style.color = '#94a3b8';
          copyBtn.style.borderColor = '#334155';
        }, 2000);
      });
    });

    wrapper.appendChild(copyBtn);
  });
});
