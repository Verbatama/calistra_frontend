export default function getHeaders() {
    const token = localStorage.getItem('token')
    
     return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearertoken ${token}` } : {})
    } 

   
}
