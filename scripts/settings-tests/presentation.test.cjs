// Path: scripts/settings-tests/presentation.test.cjs
// Purpose: Cover themed rendering, pending actions, confirmation dismissal, navigation, and Tour replay.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, act, React } = require("./harness.cjs");
const flatten = value => Array.isArray(value) ? Object.assign({}, ...value.map(flatten)) : value || {};

for (const mode of ["light", "dark"]) {
  test(mode + " Settings screens use Manrope, semantic surfaces, and one page scroll area", async () => {
    for (const screen of ["index", "account", "security", "blocking", "help", "manage-account", "appearance", "privacy", "notifications"]) {
      const h = createHarness({ mode });
      if (screen === "account" || screen === "security") h.replies.push({ email: "member@example.com" });
      if (screen === "blocking") h.replies.push({ blocks: [] });
      try {
        await h.mount(screen);
        for (const node of h.all("Text")) {
          const style = flatten(node.props.style);
          assert.match(style.fontFamily, /^Manrope_/, screen + ": " + h.text(node));
          assert.ok(Object.values(h.colors).includes(style.color), screen + " text color");
        }
        for (const node of h.all("View")) {
          const style = flatten(node.props.style);
          if (style.backgroundColor) assert.ok(Object.values(h.colors).includes(style.backgroundColor), screen + " surface");
        }
        const pageScroll = h.all("ScrollView").filter(node => flatten(node.props.style).flex === 1);
        assert.equal(pageScroll.length, 1, screen);
        assert.equal(flatten(pageScroll[0].props.contentContainerStyle).paddingBottom, 62);
        assert.equal(flatten(pageScroll[0].props.style).height, undefined);
        assert.equal(pageScroll[0].props.keyboardShouldPersistTaps, "handled");
      } finally { await h.unmount(); }
    }
  });
}

test("appearance changes immediately and retains every existing route and public link", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  await h.mount("appearance");
  await act(async () => { h.all("Pressable").find(node => node.props.accessibilityRole === "radio" && h.text(node).startsWith("Dark")).props.onPress(); });
  assert.equal(h.colors.background, "#0F1012");
  assert.equal(h.all("Pressable").find(node => node.props.accessibilityState?.selected).props.accessibilityState.checked, true);
  await h.unmount();
  await h.mount("index");
  const { NavRow } = h.load("src/components/settings/_ui.tsx");
  const rows = h.tree.root.findAllByType(NavRow);
  const labels = ["Account", "Security & Login", "Privacy controls", "Blocking & Safety", "Appearance", "Notifications", "Help & Support"];
  assert.equal(rows.some(node => node.props.label === "Delete account"), false);
  for (const label of labels) await act(async () => rows.find(node => node.props.label === label).props.onPress());
  assert.deepEqual(h.routes, ["account", "security", "privacy", "blocking", "appearance", "notifications", "help"].map(route => "/(tabs)/settings/" + route));
  for (const label of ["Privacy Policy", "Terms of Service", "Account deletion information"]) {
    await act(async () => rows.find(node => node.props.label === label).props.onPress());
  }
  assert.deepEqual(h.routes.slice(-3), ["https://rombuzz.com/privacy", "https://rombuzz.com/terms", "https://rombuzz.com/delete-account"]);
  await h.unmount();
  h.replies.push({ email: "member@example.com" });
  await h.mount("security");
  await h.press("Delete account");
  assert.equal(h.routes.at(-1), "/(tabs)/settings/manage-account");
});

test("pending form action blocks duplicate taps and restores its enabled state", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  h.replies.push({ firstName: "Alex", lastName: "Lee" });
  await h.mount("account");
  let finish;
  h.replies.push(() => new Promise(resolve => { finish = resolve; }));
  const onPress = h.button("Save name").props.onPress;
  let pending;
  await act(async () => { pending = onPress(); });
  assert.equal(h.button("Save name").props.disabled, true);
  assert.equal(h.button("Save name").props.accessibilityState.busy, true);
  await act(async () => { await onPress(); });
  assert.equal(h.requests.length, 2);
  await act(async () => { finish({ firstName: "Alex", lastName: "Lee" }); await pending; });
  await h.press("OK");
  assert.equal(h.button("Save name").props.disabled, false);
});

test("Android modal dismissal selects Cancel and cannot invoke a destructive action", async t => {
  const h = createHarness({ mode: "dark" }); t.after(() => h.unmount());
  await h.mount("index");
  await h.press("Log out");
  const modal = h.all("Modal").find(node => node.props.visible);
  await act(async () => modal.props.onRequestClose());
  assert.equal(h.deletedKeys.length, 0);
  assert.equal(h.all("Modal").some(node => node.props.visible), false);
});

test("Tour row replays repeatedly, closes on Settings, and never clears signup state", async t => {
  const h = createHarness(); t.after(() => h.unmount());
  const Home = h.load("app/(tabs)/settings/index.tsx").default;
  const { useFirstSignupTour } = h.load("src/features/onboarding/useFirstSignupTour.ts");
  function Probe() { return React.createElement("TourState", useFirstSignupTour()); }
  function Page() { return React.createElement(React.Fragment, null, React.createElement(Home), React.createElement(Probe)); }
  await h.mount(Page);
  const { NavRow } = h.load("src/components/settings/_ui.tsx");
  const replay = () => h.tree.root.findAllByType(NavRow).find(node => node.props.label === "Tour").props.onPress();
  for (let pass = 0; pass < 2; pass++) {
    await act(async () => replay());
    assert.equal(h.all("TourState")[0].props.visible, true);
    assert.equal(h.all("TourState")[0].props.entry, "settings");
    await act(async () => h.all("TourState")[0].props.complete());
    assert.equal(h.all("TourState")[0].props.visible, false);
  }
  assert.equal(h.tour.cleared, 0);
  assert.deepEqual(h.routes, []);
  assert.equal(h.storageWrites.length, 0);
});
