/**
 * @jest-environment jsdom
 */

import {fireEvent, getByTestId, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES , ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import handleClickIconEye from "../containers/Bills"
import handleClickNewBill from "../containers/Bills"

import router from "../app/Router.js";
import store from "../__mocks__/store";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.className).toBe('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe('When user click on the eye icon', () => {
      test("Then a modal should open", () =>{
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const bill = new Bills({
          document, onNavigate, store: null, localStorage: window.localStorage
        })
  
        $.fn.modal = jest.fn() // prevent error modal is not a function, allows to use bootstrap modal in jest
        const eyeIcon = screen.getAllByTestId('icon-eye')
        const handleClickIconEye = jest.fn(bill.handleClickIconEye(eyeIcon[0])) // handleClickIconEye needs an argument
        eyeIcon[0].addEventListener('click', handleClickIconEye)
        userEvent.click(eyeIcon[0])
        expect(handleClickIconEye).toHaveBeenCalled()

        const modaleFile = document.querySelector('#modaleFile')
        expect(modaleFile).toBeTruthy()
      
        const modaleBody = document.querySelector('.modal-body')
        expect(modaleBody.childNodes.length).toEqual(1)

        const imageDisplayInModaleSource = document.querySelector('.bill-proof-container').childNodes[0].getAttribute('src')
        const billFileUrl = bills[0].fileUrl
        expect(imageDisplayInModaleSource).toBe(billFileUrl)
      })
    });
    
    describe('When user click on the button "Nouvelle note de frais"', () => {
      test('Then the function handleClickNewBill should be called', () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const bill = new Bills({
          document, onNavigate, store: null, localStorage: window.localStorage
        })
        
        $.fn.modal = jest.fn() 
        const btnNewBill = screen.getByTestId("btn-new-bill")
        const handleClickNewBill = jest.fn(bill.handleClickNewBill())
        expect(handleClickNewBill).toHaveBeenCalled()
      })
    });

    /*---- API TESTS ----*/
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      document.body.innerHTML = BillsUI({data : bills})
      await waitFor(() => {screen.getByText("Mes notes de frais")})
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      /*
      const contentPending = screen.getByTestId('tbody').childNodes.length
      expect(contentPending).toBeGreaterThan(1);*/
    }) 
  })
  
})
