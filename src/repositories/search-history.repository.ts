import {and, desc, eq} from "drizzle-orm";
import { db } from "../db";
import { searchHistory } from "../db/schema";

const SAVED_LOCATION="SAVED_LOCATION";

export class SearchHistoryRepository{
    async createSavedLocation(data:{
        userId:number,
        label:string,
        latitude:number,
        longitude:number
    }){
        const [location]=await db.insert(searchHistory).values({
            userId:data.userId,
            label: data.label,
            latitude: String(data.latitude),
            longitude: String(data.longitude),
            radius:5000,
            resultsCount:0,
            recordType: SAVED_LOCATION
        }).returning({
            id: searchHistory.id,
            label: searchHistory.label,
            latitude: searchHistory.latitude,
            longitude: searchHistory.longitude,
            recordType: searchHistory.recordType,
            searchedAt: searchHistory.searchedAt
        });

        return location;
    }

    async findSavedLocations(userId:number){
        return db.select({
            id: searchHistory.id,
            label: searchHistory.label,
            latitude: searchHistory.latitude,
            longitude: searchHistory.longitude,
            recordType: searchHistory.recordType,
            searchedAt: searchHistory.searchedAt,
        }).from(searchHistory).where(and(
            eq(searchHistory.userId, userId),
            eq(searchHistory.recordType,SAVED_LOCATION)
        )).orderBy(desc(searchHistory.searchedAt));
        
    }

    async updateSavedLocation( id:number,userId:number,label:string){
       const [location]=await await db.update(searchHistory).set({label}).where(and(
        eq(searchHistory.id, id),
        eq(searchHistory.userId, userId),
        eq(searchHistory.recordType, SAVED_LOCATION)
       )).returning({
        id: searchHistory.id,
        label: searchHistory.label,
        latitude: searchHistory.latitude,
        longitude: searchHistory.longitude,
        recordType: searchHistory.recordType,
        searchedAt: searchHistory.searchedAt
       });

       return location ?? null;
    }

    async deleteSavedLocation(id:number, userId:number){
        const [deleted]=await db.delete(searchHistory).where(and(
            eq(searchHistory.id, id),
            eq(searchHistory.userId, userId),
            eq(searchHistory.recordType, SAVED_LOCATION)
        )).returning({
            id: searchHistory.id
        });
        
        return deleted ?? null;
    }

}

export const searchHistoryRepository=new SearchHistoryRepository();