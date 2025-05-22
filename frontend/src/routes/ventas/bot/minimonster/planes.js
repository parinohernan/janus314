export const planes = [
    {
        id: 1,
        nombre: "Plan STARTED",
        descripcion: "Ideal para nuevos negocios",
        precio: "3000 ARS/mes",
        precio_promo: "2100 ARS/mes (3 meses)",
        beneficios: [
            {id:1, name:"Terminales", alcance:"1"},
            {id:2, name:"Vendedores", alcance:"1"},
            {id:3, name:"Clientes", alcance:"sin limite"},
            {id:4, name:"Ventas", alcance:"sin limite"},
        ]
    },
    {
        id: 2,
        nombre: "Plan BALANCED",
        descripcion: "Ideal para negocios establecidos",
        precio: "9000 ARS/mes",
        precio_promo: "6000 ARS/mes (3 meses)",
        beneficios: [
            {id:1, name:"Terminales", alcance:"3"},
            {id:2, name:"Vendedores", alcance:"3"},
            {id:3, name:"Clientes", alcance:"sin limite"},
            {id:4, name:"Ventas", alcance:"sin limite"},
        ]
    },
    {
        id: 3,
        nombre: "Plan TOP LEVEL",
        descripcion: "Ideal para negocios establecidos con mas de 3 empleados",
        precio: "14000 ARS/mes",
        precio_promo: "10000 ARS/mes (3 meses)",
        beneficios: [
            {id:1, name:"Terminales", alcance:"sin limite*"},
            {id:2, name:"Vendedores", alcance:"sin limite"},
            {id:3, name:"Clientes", alcance:"sin limite"},
            {id:4, name:"Ventas", alcance:"sin limite"},
        ]
    }
]