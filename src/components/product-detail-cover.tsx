"use client";

import Image from "next/image";
import { useState } from "react";
import { normaliseProductName } from "@/features/catalog/presentation";

export function ProductDetailCover({productId,name,hasCover}:{productId:string;name:string;hasCover:boolean}){
  const[failed,setFailed]=useState(false);
  const showImage=hasCover&&!failed;
  const productName=normaliseProductName(name);
  return <div className={`reference-product-cover${showImage?" has-cover":""}`}>
    {showImage?<Image src={`/api/catalog/products/${productId}/cover`} alt={`${productName} cover`} fill sizes="(max-width: 800px) 100vw, 35vw" onError={()=>setFailed(true)}/>:<><span>Prepstore</span><strong>{productName.replace(/\b(package|preparation)\b/gi,"").trim()}</strong><p>Complete Preparation Package</p><ul><li>Structured study resources</li><li>Practice tests</li><li>Clear explanations</li><li>Progress in one place</li></ul></>}
  </div>;
}
