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
exports.UpdateTracksHelper = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const material_1 = require("@mui/material");
const config_1 = require("../../config");
const UpdateTracksHelper = ({ tracks, onUpdate }) => {
    const handleUpdateTracks = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const updatedTracks = tracks.map(track => {
                if (track.spotifyUrl && (!track.label || track.label.id !== 'buildit-deep')) {
                    return Object.assign(Object.assign({}, track), { label: config_1.RECORD_LABELS['buildit-deep'] });
                }
                return track;
            });
            onUpdate(updatedTracks);
        }
        catch (error) {
            console.error('Error updating tracks:', error);
        }
    });
    return ((0, jsx_runtime_1.jsxs)(material_1.Button, Object.assign({ variant: "contained", color: "primary", onClick: handleUpdateTracks, disabled: tracks.length === 0 }, { children: ["Move to Deep (", tracks.length, ")"] })));
};
exports.UpdateTracksHelper = UpdateTracksHelper;
