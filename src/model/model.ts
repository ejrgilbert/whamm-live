// Class to store API responses [ MVC pattern's model ] 
import { WhammResponse } from "./types";

export class Model{
    static response: WhammResponse; 
    // Will always be a API response with no error or 'null'
    static no_error_response: WhammResponse | null; 
}
