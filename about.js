"use strict";

(async function initAboutPage() {
  const store = window.BAFSKITCStore;
  const data = await store.getSiteData();

  const clubName = document.getElementById("aboutClubName");
  if (clubName) clubName.textContent = data.siteText.clubName;
})();
