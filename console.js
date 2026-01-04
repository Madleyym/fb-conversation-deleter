//COPY THIS CODE AND PASTE IT IN CONSOLE

(async function () {
  // Check if we're on the right page
  const currentUrl = window.location.href;
  const messagesListUrl = "https://www.facebook.com/messages/t/";

  // If not on messages list page, redirect
  if (
    !currentUrl.includes("/messages/t/") &&
    !currentUrl.includes("/messages?")
  ) {
    console.log("🔄 Redirecting to Facebook Messages...");
    window.location.href = messagesListUrl;
    return; // Stop execution, will restart after redirect
  }

  // If on a specific conversation, go back to list
  const urlParts = currentUrl.split("/messages/");
  if (
    urlParts[1] &&
    urlParts[1].includes("/t/") &&
    urlParts[1].split("/t/")[1]
  ) {
    console.log(
      "🔄 You are in a conversation. Redirecting to messages list..."
    );
    window.location.href = messagesListUrl;
    return;
  }

  console.log("✅ On correct page. Starting script...");
  console.log("");

  // Configuration
  const keepNewest = 20; // Keep 20 newest (change as needed)
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Statistics
  let deleted = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  // Header
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║      🗑️  FACEBOOK CONVERSATION AUTO-DELETER  🗑️       ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`⚙️  Configuration:`);
  console.log(`   • Keep newest: ${keepNewest} conversations`);
  console.log(`   • Delete from: Position #${keepNewest + 1} onwards`);
  console.log(`   • Started at: ${new Date().toLocaleTimeString()}`);
  console.log("");

  // Find initial count
  const initialRows = document.querySelectorAll('[role="row"]');
  const initialCount = Array.from(initialRows).filter((r) => {
    const rect = r.getBoundingClientRect();
    return rect.left < 50 && rect.width > 300 && rect.width < 400;
  }).length;

  console.log(`📊 Initial Status:`);
  console.log(`   • Total conversations: ${initialCount}`);
  console.log(`   • To keep: ${Math.min(keepNewest, initialCount)}`);
  console.log(`   • To delete: ${Math.max(0, initialCount - keepNewest)}`);
  console.log("");
  console.log("─────────────────────────────────────────────────────────");
  console.log("");

  if (initialCount <= keepNewest) {
    console.log(`⚠️  Nothing to delete!`);
    console.log(`   You have ${initialCount} conversations (≤ ${keepNewest})`);
    console.log("");
    return;
  }

  console.log("🚀 Starting deletion process...");
  console.log("");

  while (true) {
    // Find conversations in sidebar
    const rows = document.querySelectorAll('[role="row"]');
    const sidebarRows = Array.from(rows).filter((r) => {
      const rect = r.getBoundingClientRect();
      return rect.left < 50 && rect.width > 300 && rect.width < 400;
    });

    const currentTotal = sidebarRows.length;
    const remaining = Math.max(0, currentTotal - keepNewest);

    // If target reached, STOP
    if (currentTotal <= keepNewest) {
      console.log("");
      console.log("─────────────────────────────────────────────────────────");
      console.log("✅ DELETION COMPLETE!");
      console.log("");
      console.log(`📊 Final Statistics:`);
      console.log(`   • Conversations remaining: ${currentTotal}`);
      console.log(`   • Successfully deleted: ${deleted}`);
      console.log(`   • Failed attempts: ${failed}`);
      console.log(`   • Skipped: ${skipped}`);

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const avgTime = deleted > 0 ? (elapsed / deleted).toFixed(1) : 0;
      console.log(`   • Time elapsed: ${elapsed}s`);
      console.log(`   • Average per deletion: ${avgTime}s`);
      console.log("");
      console.log(`🎉 Kept ${keepNewest} newest conversations!`);
      console.log("─────────────────────────────────────────────────────────");
      break;
    }

    // Get conversation name for better logging
    const rowToDelete = sidebarRows[keepNewest];
    const conversationName = rowToDelete.textContent.trim().substring(0, 30);

    console.log(`🎯 Target: Position #${keepNewest + 1}`);
    console.log(
      `   Name: "${conversationName}${
        conversationName.length >= 30 ? "..." : ""
      }"`
    );
    console.log(
      `   Progress: ${deleted}/${
        initialCount - keepNewest
      } deleted | ${remaining} remaining`
    );

    // Hover
    const rect = rowToDelete.getBoundingClientRect();
    rowToDelete.dispatchEvent(
      new MouseEvent("mouseover", {
        bubbles: true,
        clientX: rect.left + rect.width - 50,
        clientY: rect.top + rect.height / 2,
      })
    );

    await wait(500);

    // Find menu button
    const buttons = rowToDelete.querySelectorAll('[role="button"]');
    let menuBtn = null;
    for (const btn of buttons) {
      const btnRect = btn.getBoundingClientRect();
      if (btnRect.left > rect.left + rect.width - 100) {
        menuBtn = btn;
        break;
      }
    }

    if (!menuBtn) {
      console.log("   ❌ Menu button not found - skipping...");
      failed++;
      continue;
    }

    console.log("   ⏳ Opening menu...");
    menuBtn.click();
    await wait(700);

    // Click "Delete"
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    let deleteItem = null;

    console.log(`   📋 Found ${menuItems.length} menu items`);

    for (const item of menuItems) {
      if (
        item.textContent.toLowerCase().includes("delete") ||
        item.textContent.toLowerCase().includes("hapus")
      ) {
        deleteItem = item;
        console.log(`   ✓ Found delete option: "${item.textContent.trim()}"`);
        break;
      }
    }

    if (!deleteItem) {
      console.log("   ❌ Delete option not found in menu - skipping...");
      document.body.click();
      failed++;
      continue;
    }

    console.log("   ⏳ Clicking delete...");
    deleteItem.click();
    await wait(700);

    // Confirm
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      const confirmBtns = dialog.querySelectorAll('[role="button"], button');
      console.log(`   📋 Found ${confirmBtns.length} dialog buttons`);

      let confirmed = false;
      for (const btn of confirmBtns) {
        if (
          btn.textContent.toLowerCase().includes("delete") ||
          btn.textContent.toLowerCase().includes("hapus")
        ) {
          console.log(`   ✓ Confirming deletion...`);
          btn.click();
          deleted++;
          confirmed = true;
          console.log(
            `   ✅ SUCCESS! Deleted ${deleted}/${initialCount - keepNewest}`
          );
          console.log("");
          await wait(1000);
          break;
        }
      }

      if (!confirmed) {
        console.log("   ❌ Confirmation button not found - skipping...");
        failed++;
      }
    } else {
      console.log("   ❌ Confirmation dialog not found - skipping...");
      failed++;
    }

    await wait(500);
  }

  console.log(`🎉 FINAL: Deleted ${deleted} conversations, kept 20 newest!`);
})();
