(function () {
  const canvas = document.getElementById("hero-graph");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const palette = {
    bg: "rgba(11, 15, 20, 0)",
    node: "#1e2a38",
    nodeAccent: "rgba(61, 214, 198, 0.14)",
    edge: "rgba(61, 214, 198, 0.22)",
    dot: "#3dd6c6",
    label: "rgba(139, 156, 179, 0.85)",
  };

  const nodes = [
    { id: "gh", label: "GitHub", x: 0.18, y: 0.28, r: 28, kind: "repo" },
    { id: "map", label: "Repo map", x: 0.42, y: 0.22, r: 32, kind: "synky" },
    { id: "sync", label: "IAM sync", x: 0.62, y: 0.42, r: 30, kind: "synky" },
    { id: "acct", label: "AWS account", x: 0.82, y: 0.3, r: 28, kind: "account" },
    { id: "role1", label: "Deploy role", x: 0.35, y: 0.68, r: 22, kind: "role" },
    { id: "role2", label: "Deploy role", x: 0.58, y: 0.72, r: 22, kind: "role" },
    { id: "role3", label: "Deploy role", x: 0.78, y: 0.62, r: 22, kind: "role" },
  ];

  const edges = [
    ["gh", "map"],
    ["map", "sync"],
    ["sync", "acct"],
    ["sync", "role1"],
    ["sync", "role2"],
    ["sync", "role3"],
    ["acct", "role3"],
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointer = { x: 0.5, y: 0.5, active: false };
  let tick = 0;
  let raf = 0;

  function nodeById(id) {
    return nodes.find((n) => n.id === id);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(rect.width, 1);
    height = Math.max(rect.height, 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawEdge(from, to, phase) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 6 * Math.sin(phase);
    const ny = (dx / len) * 6 * Math.sin(phase);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    const mx = (from.x + to.x) / 2 + nx;
    const my = (from.y + to.y) / 2 + ny;
    ctx.beginPath();
    ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = palette.dot;
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(phase * 1.4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawNode(node, phase) {
    const drift = reducedMotion
      ? 0
      : Math.sin(phase + node.x * 8) * 3 + Math.cos(phase * 0.7 + node.y * 6) * 2;
    const px = pointer.active ? (pointer.x - 0.5) * 10 : 0;
    const py = pointer.active ? (pointer.y - 0.5) * 8 : 0;
    const x = node.x * width + px;
    const y = node.y * height + drift + py;
    const r = node.r;

    ctx.beginPath();
    ctx.arc(x, y, r + 10, 0, Math.PI * 2);
    ctx.fillStyle =
      node.kind === "synky" ? palette.nodeAccent : "rgba(30, 42, 56, 0.55)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = palette.node;
    ctx.fill();
    ctx.strokeStyle =
      node.kind === "synky" ? "rgba(61, 214, 198, 0.45)" : "rgba(30, 42, 56, 1)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (node.kind === "synky") {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = palette.dot;
      ctx.fill();
    }

    ctx.font = '500 11px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = palette.label;
    ctx.textAlign = "center";
    ctx.fillText(node.label, x, y + r + 16);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    const phase = reducedMotion ? 0 : tick * 0.012;

    edges.forEach(([a, b], i) => {
      const from = nodeById(a);
      const to = nodeById(b);
      if (!from || !to) return;
      const fx = from.x * width;
      const fy = from.y * height;
      const tx = to.x * width;
      const ty = to.y * height;
      drawEdge({ x: fx, y: fy }, { x: tx, y: ty }, phase + i * 0.5);
    });

    nodes.forEach((node, i) => drawNode(node, phase + i * 0.35));

    if (!reducedMotion) {
      tick += 1;
      raf = window.requestAnimationFrame(render);
    }
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    pointer.active = true;
    if (reducedMotion) render();
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
    if (reducedMotion) render();
  });

  resize();
  render();

  window.addEventListener("resize", () => {
    resize();
    if (reducedMotion) render();
  });
})();
