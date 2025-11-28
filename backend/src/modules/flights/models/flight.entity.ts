import { Column } from "typeorm";


export class Flights{

    @Column({
        type:String
    })
    title:string
}