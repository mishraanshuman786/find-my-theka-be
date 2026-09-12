import {desc,eq} from "drizzle-orm";
import { db } from "../db";
import { searchHistory } from "../db/schema";

export class SearchHistoryRepository{
     async create(data:{
        userId:number,
        latitude:number,
        longitude:number,
        radius?:number,
        resultCount?:number
     }){
        const [search]=await db.insert(searchHistory).values({
            userId:data.userId,
            latitude:data.latitude.toString(),
            longitude:data.longitude.toString(),
            radius:data.radius ?? 5000,
            resultCount:data.resultCount?? 0
        }).returning();

        return search;

     }


    //  get a user search History
    async findByUserId(userId:number,limit=10){
        return db.select()
        .from(searchHistory)
        .where(eq(searchHistory.userId,userId))
        .orderBy(desc(searchHistory.searchedAt))
        .limit(limit);


    }
}

export const searchHistoryRepository=new SearchHistoryRepository();