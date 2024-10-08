import {
    addButtonSel,
    addNewTaskButtonSel,
    barControllerSel,
    createNewTaskButtonSel,
    creatingTaskModelSel,
    newTaskTitleInputSel,
    taskNameErrorSel
} from "../support/selectors"

describe("Creating Task via UI", () => {
    before(() => {
        cy.login(Cypress.env('USERNAME'), Cypress.env('PASSWORD'))
        cy.getListId().then(function () {
            cy.visit(`https://app.clickup.com/${this.teamId}/v/li/${this.listId}`)
        })
    })

    context("when the minimum required information is entered", () => {
        const taskTitle = "New task title"

        it("should allow creating a new task", () => {
            cy.get(barControllerSel, {timeout: 30000}).find(addNewTaskButtonSel).click()
            cy.get(newTaskTitleInputSel, {timeout: 60000}).should("be.visible").as("newTaskTitleInput")
            cy.get("@newTaskTitleInput").type("draft")
            cy.get("@newTaskTitleInput").clear()
            cy.get("@newTaskTitleInput").type(taskTitle)

            // intercept the request which is sent when the task is created
            cy.intercept("POST", "/tasks/v1/subcategory/*/task").as("createTask")
            cy.get(createNewTaskButtonSel).click()

            // save the task id for further checks
            cy.wait("@createTask").then(function (interception) {
                cy.wrap(interception.response.body.id).as("taskId")
            })

            cy.get(creatingTaskModelSel).should("not.exist")
        })

        it("receives a response to a request for a created task that is successful and contains the entered information", function () {
            const query = new URLSearchParams({
                custom_task_ids: "true",
                team_id: this.teamId
            }).toString()

            cy.apiRequest('GET', `/api/v2/task/${this.taskId}?${query}`).then((response) => {
                expect(response.body.id).to.eq(this.taskId)
                expect(response.body.name).to.eq(taskTitle)
            })
        })

        after(function () {
            cy.apiRequest('DELETE', `/api/v2/task/${this.taskId}`,)
        })
    })

    context("when there are mandatory information missing", () => {
        before(function () {
            cy.visit(`https://app.clickup.com/${this.teamId}/home`)
        })

        it("should not allow creating a task without a name", () => {
            cy.get(addButtonSel, {timeout: 30000}).click()
            cy.get(newTaskTitleInputSel, {timeout: 30000}).click().clear()
            cy.get(createNewTaskButtonSel).click()
            cy.get(taskNameErrorSel).should("be.visible")
        })
    })
})