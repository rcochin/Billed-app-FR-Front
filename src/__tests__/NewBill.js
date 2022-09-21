/**
 * @jest-environment jsdom
 */

 import { screen, fireEvent, waitFor } from "@testing-library/dom"
 import userEvent from '@testing-library/user-event'
 import NewBillUI from "../views/NewBillUI.js"
 import NewBill from "../containers/NewBill.js"
 import BillsUI from "../views/BillsUI.js"
 import { ROUTES, ROUTES_PATH } from "../constants/routes"
 import { localStorageMock } from "../__mocks__/localStorage.js";
 import mockStore from '../__mocks__/store'
 import router from "../app/Router";
 
 jest.mock("../app/store", () => mockStore)
 
 describe("Given I am connected as an employee", () => {
   describe("When I am on NewBill Page", () => {
    
     test("Then it should render a form", () => {
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
       router()
       window.onNavigate(ROUTES_PATH.NewBill)
      
       expect(screen.getByTestId("form-new-bill")).toBeTruthy();
     })
   })
 
   describe("When I upload a supported proof file", () => {
     test("Then it should show the file name in input", () => {
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
      
       const html = NewBillUI()
       document.body.innerHTML = html
 
       const newBill = new NewBill({
         document, onNavigate, store: mockStore, localStorage: window.localStorage // if store null = error
       })
 
       const fileInput = screen.getByTestId('file')
       const handleChangeFile = jest.fn(newBill.handleChangeFile)
       fileInput.addEventListener('change', handleChangeFile)
       const fileUploaded = new File(['hello'], 'hello.png', {type: 'image/png'})
       userEvent.upload(fileInput, fileUploaded)
      
       expect(fileInput.files[0].name).toBe('hello.png')
     })
 
     describe("When I upload an unsupported proof file", () => {
       test("Then it should pop an alert and file input should be empty", () => {
         const onNavigate = (pathname) => {
           document.body.innerHTML = ROUTES({ pathname })
         }
  
         const newBill = new NewBill({
           document, onNavigate, store: null, localStorage: window.localStorage
         })
  
         window.alert = jest.fn(); // allows to mock browser alert about proof file change
  
         const fileInput = screen.getByTestId('file')
         const handleChangeFile = jest.fn(newBill.handleChangeFile)
         fileInput.addEventListener('change', handleChangeFile)
         const fileUploaded = new File(['hello'], 'hello.mp4', {type: 'video/mp4'})
         userEvent.upload(fileInput, fileUploaded)
         expect(handleChangeFile).toHaveBeenCalled()
         expect(window.alert).toHaveBeenCalled()
         expect(fileInput.value).toMatch("")
       })
     })
   })
 
   describe("When I send a new bill with a supported proof file", () => {
     test("Then it should submit the form and redirect me to the bills page", async() => {
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
 
       const html = NewBillUI()
       document.body.innerHTML = html
 
       const newBill = new NewBill({
         document, onNavigate, store: mockStore, localStorage: window.localStorage // if store null = error
       })
 
       window.alert = jest.fn(); // allows to mock browser alert about proof file change
      
       const fileInput = screen.getByTestId('file')
       const handleChangeFile = jest.fn(newBill.handleChangeFile)
       fileInput.addEventListener('change', handleChangeFile)
       const fileUploaded = new File(['hello'], 'hello.jpeg', {type: 'image/jpeg'})
       userEvent.upload(fileInput, fileUploaded)
       expect(handleChangeFile).toHaveBeenCalled()
       expect(window.alert).not.toHaveBeenCalled()
      
       const handleSubmit = jest.fn(newBill.handleSubmit)
       const newBillForm = screen.getByTestId('form-new-bill')
       newBillForm.addEventListener('submit', handleSubmit)
       fireEvent.submit(newBillForm) // userEvent doesn't allow submit
       expect(handleSubmit).toHaveBeenCalled()
       expect(screen.getByText('Mes notes de frais')).toBeTruthy()
     })
   })
 })
 
 // // test d'intégration POST
 describe("Given I am a user connected as Employee", () => {
   describe("When I navigate to new bill page", () => {
     test("Then it should fetches bills from mock API GET", async () => {
       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
       router()
       window.onNavigate(ROUTES_PATH.NewBill)
      
       await waitFor(() => screen.getByText("Envoyer une note de frais"))
       expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
     })
   describe("When I send a correct new bill", () => {
     beforeEach(() => {
       jest.spyOn(mockStore, "bills")
       Object.defineProperty(
           window,
           'localStorage',
           { value: localStorageMock }
       )
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.appendChild(root)
       router()
     })
     test("It should fetches bills to an API without error", async () => {
       const expectedBill = {
         "id": "47qAXb6fIm2zOKkLzMro",
         "vat": "80",
         "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
         "status": "pending",
         "type": "Hôtel et logement",
         "commentary": "séminaire billed",
         "name": "encore",
         "fileName": "preview-facture-free-201801-pdf-1.jpg",
         "date": "2004-04-04",
         "amount": 400,
         "commentAdmin": "ok",
         "email": "a@a",
         "pct": 20
       }
       const sentedBill = await mockStore.bills().update()
       expect(jest.spyOn(mockStore, "bills")).toHaveBeenCalled();
       expect(sentedBill).toMatchObject(expectedBill)
     })
     describe("When an error occurs on API", () => {
       test("It should fetches bills from an API and fails with 404 message error", async () => {
         mockStore.bills.mockImplementationOnce(() => {
           return {
             update : () =>  {
               return Promise.reject(new Error("Erreur 404"))
             }
           }})
         const html = BillsUI({ error: "Erreur 404" })
         document.body.innerHTML = html
         await new Promise(process.nextTick);
         const message = await screen.getByText(/Erreur 404/)
         expect(message).toBeTruthy()
       })
 
       test("It should fetches messages from an API and fails with 500 message error", async () => {
         mockStore.bills.mockImplementationOnce(() => {
           return {
             update : () =>  {
               return Promise.reject(new Error("Erreur 500"))
             }
           }})
         const html = BillsUI({ error: "Erreur 500" })
         document.body.innerHTML = html
         await new Promise(process.nextTick);
         const message = await screen.getByText(/Erreur 500/)
         expect(message).toBeTruthy()
         })
       })
     })
   })
 })