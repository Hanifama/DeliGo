export class ResponseAPI {

    static successOnly(message: string = 'Data berhasil diambil') {
        return {
            success: true,
            statusCode: 200,
            message,
        };
    }
    
    static success(data?: any, message: string = 'Data berhasil diambil') {
        return {
            success: true,
            statusCode: 200,
            message,
            data,
        };
    }

    static error(message: string, statusCode: number = 500) {
        return {
            success: false,
            statusCode,
            message,
        };
    }

    static notFound(message: string = 'Data tidak ditemukan') {
        return {
            success: false,
            statusCode: 404,
            message,
        };
    }

    static created(data: any, message: string = 'Data berhasil dibuat') {
        return {
            success: true,
            statusCode: 201,
            message,
            data,
        };
    }

    static updated(data: any, message: string = 'Data berhasil diupdate') {
        return {
            success: true,
            statusCode: 200,
            message,
            data,
        };
    }

    static deleted(message: string = 'Data berhasil dihapus') {
        return {
            success: true,
            statusCode: 200,
            message,
        };
    }
}