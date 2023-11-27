import MetabaseSettings from "metabase/lib/settings";
import { onlyOn } from "@cypress/skip-test";
import {
  restore,
  popover,
  visitDashboard,
  modal,
  rightSidebar,
  appBar,
  getDashboardCard,
  undoToast,
  openDashboardMenu,
  toggleDashboardInfoSidebar,
} from "e2e/support/helpers";

import { USERS } from "e2e/support/cypress_data";
import { ORDERS_DASHBOARD_ID } from "e2e/support/cypress_sample_instance_data";

const PERMISSIONS = {
  curate: ["admin"],
};

const questionDetails = {
  name: "Q1",
  native: { query: "SELECT  '42' as ANSWER" },
  display: "scalar",
};

const dashboardName = "FooBar";

describe("dashboard refresh options", () => {
  beforeEach(() => {
    restore();
  });

  Object.entries(PERMISSIONS).forEach(([permission, userGroup]) => {
    context(`${permission} access`, () => {
      userGroup.forEach(user => {
        onlyOn(permission === "curate", () => {
          describe(`${user} user`, () => {
            beforeEach(() => {
              cy.signInAsAdmin();
              cy.createNativeQuestionAndDashboard({
                questionDetails,
                dashboardDetails: { name: dashboardName },
              }).then(({ body: { dashboard_id } }) => {
                cy.wrap(dashboard_id).as("originalDashboardId");
                cy.intercept("GET", `/api/dashboard/${dashboard_id}`).as(
                  "getDashboard",
                );
                cy.intercept("PUT", `/api/dashboard/${dashboard_id}`).as(
                  "updateDashboard",
                );

                cy.signIn(user);

                visitDashboard(dashboard_id);
                assertOnRequest("getDashboard");
              });

              openDashboardMenu();
            });

            it("should be able to see default refresh options", () => {
              cy.get("@originalDashboardId").then(id => {
                cy.get(`[aria-label="Auto Refresh"]`).should("be.visible").click();
                cy.findByText("1 minute").should("be.visible");
                cy.findByText("5 minutes").should("be.visible");
                cy.findByText("10 minutes").should("be.visible");
                cy.findByText("15 minutes").should("be.visible");
                cy.findByText("30 minutes").should("be.visible");
                cy.findByText("60 minutes").should("be.visible");
              });
            });
            it("should be able to see custom refresh options ", () => {
              MetabaseSettings.set("custom-dashboard-refresh-options", "0 1 60 3600 86400 2073600 31536000");
              cy.get(`[aria-label="Auto Refresh"]`).should("be.visible").click();
                cy.findByText("Off").should("be.visible");
                cy.findByText("1 second").should("be.visible");
                cy.findByText("60 seconds").should("be.visible");
                cy.findByText("60 minutes").should("be.visible");
                cy.findByText("24 hours").should("be.visible");
                cy.findByText("365 days").should("be.visible");
            });
          });
        });
      });
    });
  });
});

function assertOnRequest(xhr_alias) {
  cy.wait("@" + xhr_alias).then(xhr => {
    expect(xhr.status).not.to.eq(403);
  });
  cy.findByText("Sorry, you don’t have permission to see that.").should(
    "not.exist",
  );
  cy.get(".Modal").should("not.exist");
}
