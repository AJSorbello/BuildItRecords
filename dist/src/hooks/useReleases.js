"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReleases = void 0;
const react_1 = require("react");
const errors_1 = require("utils/errors");
const DatabaseService_1 = require("../services/DatabaseService");
function useReleases(label) {
    const [releases, setReleases] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchReleases = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        if (!label) {
            setReleases([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = yield DatabaseService_1.databaseService.getReleases(label);
            setReleases(response.items);
            setError(null);
        }
        catch (err) {
            if (err instanceof errors_1.DatabaseApiError) {
                setError(err.message);
            }
            else {
                setError('Failed to fetch releases');
            }
            setReleases([]);
        }
        finally {
            setLoading(false);
        }
    }), [label]);
    (0, react_1.useEffect)(() => {
        fetchReleases();
    }, [fetchReleases]);
    return {
        releases,
        loading,
        error,
        refetch: fetchReleases
    };
}
exports.useReleases = useReleases;
