import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { API_ORIGIN } from "../../utils/format";
import { getToken, logoutUser } from "../../utils/auth";

// Drops empty values so that "all" / "" filters are not sent to the server.
export const buildPropertyParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) =>
                value !== undefined &&
                value !== null &&
                value !== "" &&
                value !== "all"
        )
    );

const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${API_ORIGIN}/api`,
    prepareHeaders: (headers) => {
        const token = getToken();
        if (token) {
            headers.set("Authorization", `Token ${token}`);
        }
        return headers;
    },
});

// A 401 means the token is gone (logout elsewhere, password reset):
// sign out locally so the interface matches the server.
const baseQuery = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401 && getToken()) {
        logoutUser();
        api.dispatch(apiSlice.util.resetApiState());
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: "api",

    baseQuery,

    tagTypes: ["Property", "Favorite", "User"],

    endpoints: (builder) => ({
        // params: { page, page_size, owner, property_type, deal_type, search,
        //   ordering, price_min, price_max, area_min, area_max, rooms }
        // Response: { count, next, previous, results }
        getProperties: builder.query({
            query: (params) => ({
                url: "/properties/",
                params: buildPropertyParams(params),
            }),
            providesTags: ["Property"],
        }),

        getProperty: builder.query({
            query: (id) => `/properties/${id}/`,
            providesTags: ["Property"],
        }),

        createProperty: builder.mutation({
            query: (data) => ({
                url: "/properties/",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Property"],
        }),

        updateProperty: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/properties/${id}/`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Property"],
        }),

        deleteProperty: builder.mutation({
            query: (id) => ({
                url: `/properties/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["Property", "Favorite"],
        }),

        uploadPropertyPhoto: builder.mutation({
            query: ({ propertyId, image }) => {
                const formData = new FormData();
                formData.append("image", image);

                return {
                    url: `/properties/${propertyId}/photos/`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ["Property"],
        }),

        // ids: all photo ids of the listing in the new order; the first is the cover.
        reorderPhotos: builder.mutation({
            query: ({ propertyId, ids }) => ({
                url: `/properties/${propertyId}/photos/order/`,
                method: "POST",
                body: { ids },
            }),
            invalidatesTags: ["Property"],
        }),

        deletePhoto: builder.mutation({
            query: (id) => ({
                url: `/photos/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["Property"],
        }),

        // The server returns the signed-in user's favorites; the user id
        // argument only keeps caches of different users apart.
        getFavorites: builder.query({
            query: () => "/favorites/",
            providesTags: ["Favorite"],
        }),

        addFavorite: builder.mutation({
            query: ({ property }) => ({
                url: "/favorites/",
                method: "POST",
                body: { property },
            }),
            invalidatesTags: ["Favorite"],
        }),

        deleteFavorite: builder.mutation({
            query: (id) => ({
                url: `/favorites/${id}/`,
                method: "DELETE",
            }),
            invalidatesTags: ["Favorite"],
        }),

        // Public seller card (no email).
        getUser: builder.query({
            query: (id) => `/users/${id}/`,
            providesTags: ["User"],
        }),

        getMe: builder.query({
            query: () => "/users/me/",
            providesTags: ["User"],
        }),

        updateMe: builder.mutation({
            query: (data) => ({
                url: "/users/me/",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["User"],
        }),

        registerUser: builder.mutation({
            query: (data) => ({
                url: "/register/",
                method: "POST",
                body: data,
            }),
        }),

        loginUser: builder.mutation({
            query: (data) => ({
                url: "/login/",
                method: "POST",
                body: data,
            }),
        }),

        logout: builder.mutation({
            query: () => ({
                url: "/logout/",
                method: "POST",
            }),
        }),

        requestPasswordReset: builder.mutation({
            query: (email) => ({
                url: "/password-reset/",
                method: "POST",
                body: { email },
            }),
        }),

        confirmPasswordReset: builder.mutation({
            query: (data) => ({
                url: "/password-reset/confirm/",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useGetPropertiesQuery,
    useGetPropertyQuery,
    useCreatePropertyMutation,
    useUpdatePropertyMutation,
    useDeletePropertyMutation,
    useUploadPropertyPhotoMutation,
    useReorderPhotosMutation,
    useDeletePhotoMutation,
    useGetFavoritesQuery,
    useAddFavoriteMutation,
    useDeleteFavoriteMutation,
    useGetUserQuery,
    useGetMeQuery,
    useUpdateMeMutation,
    useRegisterUserMutation,
    useLoginUserMutation,
    useLogoutMutation,
    useRequestPasswordResetMutation,
    useConfirmPasswordResetMutation,
} = apiSlice;
