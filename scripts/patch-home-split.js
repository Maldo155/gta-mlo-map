const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../app/page.tsx");
let content = fs.readFileSync(filePath, "utf8");

const tilesSectionStart = '      <section className="home-section-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px" }}>';

const spotlightSectionStart = `      <section className="home-section-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 24px" }}>
        <div
          className="home-spotlight-grid"`;

const styleBlockStart = "\r\n\r\n      <style>";

const replacement = `      <section className="home-section-wrap" style={{ width: "100%", margin: 0, padding: 0 }}>
        <HomeSplitContent
          t={t}
          mlos={mlos}
          featuredMlos={featuredMlos}
          conveyorMlos={conveyorMlos}
          servers={servers}
          conveyorServers={conveyorServers}
          displayedPartners={displayedPartners}
          partnerConveyorItems={partnerConveyorItems}
          displayedSpotlight={displayedSpotlight}
          showPartnersSection={SHOW_PARTNERS_SECTION}
          showPartnersConveyor={SHOW_PARTNERS_CONVEYOR}
          conveyorSpeedSec={MLO_CONVEYOR_SPEED_SEC}
        />
      </section>

`;

const idx1 = content.indexOf(tilesSectionStart);
const idx2 = content.indexOf(styleBlockStart);

if (idx1 === -1 || idx2 === -1) {
  console.error("Could not find markers. idx1=", idx1, "idx2=", idx2);
  process.exit(1);
}

const before = content.slice(0, idx1);
const after = content.slice(idx2);
content = before + replacement + after;
fs.writeFileSync(filePath, content);
console.log("Patch applied successfully");
